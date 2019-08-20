import axios from 'axios';

var hmt_client_processor = function(settings){

  var me = this

  this.url = function(endpoint, use_suffix){

    return this.api_url + endpoint + (use_suffix ? this.api_url_suffix : '')

  }
  
  this.spreedly_url = function(spreedly_environment_key){

    return 'https://core.spreedly.com/v1/payment_methods.json?environment_key='+spreedly_environment_key
    
  }
  
  this.fullsteam_url = function(){

    return 'https://api'+(this.env == 'local' || this.env == 'dev' || this.env == 'staging' ? '-ext' : '')+'.fullsteampay.net/'

  }
  
  this.submit_transaction = function(card, transaction, cb){
    this._remove_card_data()
    // determine the method to use spreedly | fullsteam   

    if(transaction.processor_method == 'spreedly')
      this._submit_spreedly(card, transaction, cb)
    else if(transaction.processor_method == 'fullsteam')
      this._submit_fullsteam(card, transaction, cb)
    else
      this._throw_error(true, {status: 'error', msg: 'No processing method setup'}, cb)
      
  }
  
  /* SPREEDLY */
  
  this._submit_spreedly = function(card, transaction, cb){

    if (transaction.payment_token) {
      me._submit_spreedly_transaction(transaction, function(err, transaction_res) {

        if(transaction.cb_data)
          transaction_res.cb_data = transaction.cb_data
        
        me._respond(err, transaction_res, cb);
        
      });
    } else {
      me._get_spreedly_token(card, transaction.spreedly_environment_key, function(err, token_res){

        if(err) {
          if(transaction.cb_data)
            token_res.cb_data = transaction.cb_data

          me._respond(err, token_res, cb)
          return;
        }
  
        transaction.payment_token = token_res.transaction.payment_method.token

        if(transaction.payments)
          transaction.payments = me._update_payments_token(transaction.payments, transaction.payment_token)
        
        me._submit_spreedly_transaction(transaction, function(err, transaction_res){
          
          if(transaction.cb_data)
            transaction_res.cb_data = transaction.cb_data
          
          if(!err && transaction_res.ticket_key)
            me._save_card_to_webuser({ticket_key: transaction_res.ticket_key})

          me._respond(err, transaction_res, cb)
          
        })
        
      })
    }

    if(transaction.cc_retain && transaction.cc_retain == 'y')
        me.save_card(card, transaction, 'fullsteam')
    
  }

  this._update_payments_token = function(payments, payment_token){
    //for split payments we need the token
    for(var i =0; i < payments.length; i++){
      var payment = payments[i]
      if(payment.type == 'credit')
        payments[i].payment_token = payment_token
    }
    return payments
  }
  
  this._get_spreedly_token = function(card, spreedly_environment_key, cb){

    me._request({
      url: me.spreedly_url(spreedly_environment_key),
      type: 'POST',
      withCredentials : false,
      data: card,
      cb : function(err, res){
        me._respond(err, res, cb)
      }
    })
    
  }
  
  this._submit_spreedly_transaction = function(transaction, cb){
    
    me._request({
      url: me.url('shop/carts/submit', true),
      type: 'POST',
      data: transaction,
      form_encoded: true,
      withCredentials: true,
      cb : function(err, res){
        me._respond(err, res, cb)
      }
    })
    
  }
  
  /* FULLSTEAM */
  
  this._submit_fullsteam = function(card, transaction, cb){
    
    if (transaction.payment_token) {

      me._submit_fullsteam_transaction(transaction, function(err, transaction_res){
        
        if(transaction.cb_data)
          transaction_res.cb_data = transaction.cb_data

        me._respond(err, transaction_res, cb)
    
      })

    } else {
      me._get_fullsteam_auth_key(function(err, authentication_key_res){

        var auth_key = null
        
        if(authentication_key_res && authentication_key_res.status && authentication_key_res.status == 'ok' && authentication_key_res.authenticationKey)
          auth_key = authentication_key_res.authenticationKey
        
        // TODO validate the key
        
        me._get_fullsteam_token(card, transaction, auth_key, function(err, token_res){
          
          // TODO validate the token
          
          if(!token_res || !token_res.isSuccessful || !token_res.token){
          
            if(transaction.cb_data)
              token_res.cb_data = transaction.cb_data

            return me._handle_fullsteam_error(token_res, cb)
          }
  
          transaction.payment_token = token_res.token

          if(transaction.payments)
            transaction.payments = me._update_payments_token(transaction.payments, transaction.payment_token)
        
          me._submit_fullsteam_transaction(transaction, function(err, transaction_res){
            
            if(transaction.cb_data) 
              transaction_res.cb_data = transaction.cb_data
            
            if(!err && transaction_res.ticket_key)
              me._save_card_to_webuser({ticket_key: transaction_res.ticket_key})
            
            me._respond(err, transaction_res, cb)
        
          })
        
        })
  
      })
    }

    if(transaction.cc_retain && transaction.cc_retain == 'y'){
      if(!transaction.spreedly_environment_key){
        transaction.spreedly_environment_key = me._get_spreedly_env_key()
      }
      me.save_card(card, transaction, 'spreedly')
    }

  }

  this._get_spreedly_env_key = function(){
    if(this.spreedly_environment_key)
      return this.spreedly_environment_key

    if(config && config.spreedly_environment_key)
      return config.spreedly_environment_key

    return ''
  }

  this.save_card = function(card, transaction, processor, ticket_key){

    if(!card || !card.payment_method || !card.payment_method.credit_card)
      return

    var card_data = card.payment_method.credit_card

    var args = {card: card_data, processor: processor}

    ticket_key = ticket_key || ''
    if(ticket_key)
      args.ticket_key = ticket_key

    if(processor == 'spreedly'){
      me._get_spreedly_token(card, transaction.spreedly_environment_key, function(err, token_res){
        if(err) {
          return;
        }
        if(token_res.transaction && token_res.transaction.payment_method && token_res.transaction.payment_method.token)
          args.token = token_res.transaction.payment_method.token

        me._save_card_to_webuser(args);
        
      })
    }

    if(processor == 'fullsteam'){
      me._get_fullsteam_auth_key(function(err, authentication_key_res){

      var env_key = null
      
      if(authentication_key_res && authentication_key_res.status && authentication_key_res.status == 'ok' && authentication_key_res.authenticationKey)
        env_key = authentication_key_res.authenticationKey

        if(!env_key)
          return

        me._get_fullsteam_token(card, transaction, env_key, function(err, token_res){
          
          if(!token_res || !token_res.isSuccessful || !token_res.token)
            return

          args.token = token_res.token;
        
          me._save_card_to_webuser(args);
        
        })

      })

    }

  }

  this.webuser_save_card = function(card, data, webuser_id, cb) {

		me._get_spreedly_token(card, data.spreedly_environment_key, function(err, token_res) {
			if (err) {
				me._respond(err, token_res, cb);
				return;
			}

			var request_data = {
        webuser_id: webuser_id,
				token: token_res.transaction.payment_method.token,
        vault: 'spreedly'
			};

			me._request({
				url: me.url('public/users/save_credit_card', false),
				type: 'POST',
				withCredentials : false,
				data: request_data,
				form_encoded: true,
				cb : function(err, res) {
          if(res && res.status == '200' && res.statusText == 'OK')
            res = res.data

          if(!res || !res.status || res.status != 'ok'){
            return me._respond(err, res, cb);
          }

					me._get_fullsteam_auth_key(function(err, authentication_key_res) {
						var env_key = null;

						if (
							authentication_key_res &&
							authentication_key_res.status &&
							authentication_key_res.status == 'ok' &&
							authentication_key_res.authenticationKey
						)
							env_key = authentication_key_res.authenticationKey;


						if (!env_key) return;

            if(!data.zip && card.payment_method.credit_card.zip)
              data.zip = card.payment_method.credit_card.zip


						me._get_fullsteam_token(card, data, env_key, function(err, token_res) {
							if (!token_res || !token_res.isSuccessful || !token_res.token) return me._respond(err, token_res, cb);

							var card_data = card.payment_method.credit_card
								? me._format_card_for_save(card.payment_method.credit_card)
								: null;

							var data = {
                webuser_id: webuser_id,
								vault: 'fullsteam',
								token: token_res.token,
								card_data: card_data
							};

							me._request({
								url: me.url('public/users/save_additional_card', false),
								type: 'POST',
								withCredentials : false,
								data: data,
								form_encoded: true,
								cb : function(err, res) {
									me._respond(err, res, cb);
								}
							});
						});
					});
				}
			});
		});
	}

  this._save_card_to_webuser = function(args){

    me._remember_card_data(args)

    var card_data = me.card_data ? me._format_card_for_save(me.card_data) : null

    if(me.card_ticket_key && card_data && me.card_token && me.card_processor){

      var data = {
        ticket_key: me.card_ticket_key,
        vault: me.card_processor,
        token: me.card_token,
        card_data: card_data
      }

      me._request({
        url: me.url('public/orders/save_additional_card', false),
        type: 'POST',
        withCredentials : false,
        data: data,
        form_encoded: true,
        cb : function(err, res){
          // me._respond(err, res, cb)
        }
      })
    }

  }

  this._format_card_for_save = function(card_data){
    
    if(!card_data.full_name)
      return false
    if(!card_data.month)
      return false
    if(!card_data.year)
      return false
    if(!card_data.number)
      return false

    return {
      full_name : card_data.full_name,
      last_four : me._get_last_four(card_data.number),
      exp_month : card_data.month,
      exp_year : card_data.year,
    }
  }

  this._get_last_four = function(cc_num){
    return cc_num.substr(cc_num.length - 4)
  }

  this._remember_card_data = function(args){

    if(args.card)
      me.card_data = args.card
    if(args.token)
      me.card_token = args.token
    if(args.processor)
      me.card_processor = args.processor
    if(args.ticket_key)
      me.card_ticket_key = args.ticket_key
  }

  this._remove_card_data = function(){

    delete me.card_data
    delete me.card_token
    delete me.processor
    delete me.card_ticket_key
  }
  
  this._get_fullsteam_auth_key = function(cb){
    
    me._request({
      url: this.url('shop/processors/get_authentication_key', true),
      cb : function(err, res){
        me._respond(err, res, cb)
      }
    })
    
  }

  this._get_fullsteam_token = function(card, transaction, auth_key, cb){
    if(
      !card || 
      !card.payment_method || 
      !card.payment_method.credit_card || 
      !card.payment_method.credit_card.number || 
      !card.payment_method.credit_card.month || 
      !card.payment_method.credit_card.year || 
      !card.payment_method.credit_card.full_name || 
      !card.payment_method.credit_card.verification_value
    ){
      cb(true, 'Missing required card inputs')
      return
    }
    
    var data = {
      "clearTextCardData": {
        "cardNumber": card.payment_method.credit_card.number.replace(/\s/g, ''),
        "cvv": card.payment_method.credit_card.verification_value,
        "expirationMonth": card.payment_method.credit_card.month,
        "expirationYear": card.payment_method.credit_card.year,
        "billingInformation": {
          "nameOnAccount": card.payment_method.credit_card.full_name,
          // "businessName": "string",
          "firstName": transaction.f_name || null,
          "lastName": transaction.l_name || null,
          // "middleName": "string",
          "address1": transaction.address1 || null,
          "address2": transaction.address2 || null,
          // "address3": "string",
          "city": transaction.city || null,
          "state": transaction.state || null,
          "zip": transaction.zip || null,
        //   "country": "string",
          "phone": transaction.phone || null,
        //   "phoneCountryCode": 0,
          "email": transaction.email || null,
        }
      },
      "cardEntryContext": this.app_type == 'box' ? 1 : 5,
      "performAccountVerification": true
    }
    
    me._request({
      url: this.fullsteam_url() + 'api/token/card/clearText/create',
      type: 'POST',
      cors: true,
      crossdomain: true,
      data: data,
      json: true,
      withCredentials : false,
      auth_key: auth_key,
      cb : function(err, res){
        me._respond(err, res, cb)
      }      
    })

  }
  
  this._submit_fullsteam_transaction = function(transaction, cb){
    
    me._request({
      url: this.url('shop/carts/submit', true),
      type: 'POST',
      data: transaction,
      form_encoded: true,
      withCredentials: true,
      cb : function(err, json){
        me._respond(err, json, cb)
      }
    })
    
  }
  
  this._request = function(opts){

    // default
    var headers = {}
    
    if(opts.json)
      headers['content-type'] = 'application/json;charset=UTF-8'
    
    if(opts.form_encoded){
      headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
      opts.data = me._serialize(opts.data)
    }

    if(opts.auth_key)
      headers['authenticationKey'] = opts.auth_key

    axios({
      method: opts.type || 'GET',
      url: opts.url,
      mode: 'no-cors',
      credentials: 'same-origin',
      headers: headers,
      withCredentials: opts.withCredentials || false,
      crossdomain: opts.crossdomain || false,
      data: opts.data
    }).then(function(response){
      // react native seems to have a bug where the statusText comes through as undefined
      // to get around it we'll set the prop manually for status 200 so we can pass any checks for it in the lib
      if (me.isHmtMobile && response.status == 200 && !response.statusText) {
        response.statusText = 'OK';
      }
      
      if(opts.cb)
        opts.cb(null, response)
      
    }).catch(function(error, res){
      var error_msg = me._format_error(error, opts.url)
      if(!res)
        res = {}
      
      if(!res.status && res.status !== 'error')
        res.status = 'error'

      res.msg = error_msg

      if(opts.cb)
        opts.cb(error, res)
      
    });
    
  }

  this._format_error = function(error, processor_url) {
    if(processor_url.indexOf('core.spreedly.com') != -1){
      return this._format_spreedly_error(error)
    } else {
      return this._format_fullsteam_error(error)
    }
  }

  this._format_spreedly_error = function(error){
    var res = null;
    if(error.response && error.response.data && error.response.data.errors) {
      var error_msg = 'Processing Error:<br>';
      for(var i =0; i < error.response.data.errors.length; i++ ){
        var err = error.response.data.errors[i]
        error_msg += err.message ? '- '+err.message+"<br>" : ''
      }
      return error_msg
    }

    return 'Unkown error'

  }

  this._format_fullsteam_error = function(error){
    return error && error.msg ? error.msg : 'Unkown error'
  }
  
  this._handle_fullsteam_error = function(res, cb){
    
    var msg = ''
    
    if(res && res.responseDetails){
      for(key in res.responseDetails)
        msg += res.responseDetails[key].message+"\n\n"
    }

    if(res && res.issuerResponseDetails){
      var issuerResponseCode = res.issuerResponseDetails.issuerResponseCode || 0
      var issuerResponseDescription = res.issuerResponseDetails.issuerResponseDescription || ''
      var CVVResponseCode = res.issuerResponseDetails.cvvResponseCode && ['M', 'P'].indexOf(res.issuerResponseDetails.cvvResponseCode) == -1 ? res.issuerResponseDetails.cvvResponseCode : 0
      var CVVResponseDescription =  CVVResponseCode && res.issuerResponseDetails.cvvResponseDescription ? res.issuerResponseDetails.cvvResponseDescription : ''
      //we only look for cvv not M (match), P (not processed) cvv

      if(CVVResponseDescription){
        msg = "CVV Error: "+CVVResponseDescription; //takes precedence
      } else {
        if(msg == '' && issuerResponseDescription)
          msg = "Error: "+issuerResponseDescription

        if(msg == '' && (!issuerResponseCode || issuerResponseCode == '00'))
          msg = "CPE2: Missing error code"

        if(msg == '') 
          msg = "CPE3: Unkown issuer error"

      };
    };

    msg = msg || "CPE4: Unknown processor error"

    res.msg = msg;
    
    return me._throw_error(true, res, cb)
    
  }
  
  this._respond = function(err, res, cb){

    
    if(err || !res || res.status == 'error'){
      me._throw_error(err, res, cb)
      return
    }

    if(cb){
      if(res.data){
        cb(null, res.data)
      }else{
        cb(null, res)
      }
    }
    
  }
  
  this._throw_error = function(err, res, cb){
        
    if(!err && res.msg)
      err = res.msg
    
    if(!err)
      err = true
    
    if(cb)
      cb(err, res)
    
  }
  
  this._serialize = function(obj, prefix) {
    
    var str = [], p;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p,
          v = obj[p];
        str.push((v !== null && typeof v === "object") ?
          me._serialize(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
    
  }

  this.api_url = settings.api_url || '' // set when the script is loaded

  this.api_url_suffix = settings.api_url_suffix || '' // set when the script is loaded

  this.env = settings.env || '' // set when the script is loaded
  
  this.app_type = settings.app_type || '' // set prior to submit (online | box)

  this.isHmtMobile = settings.isHmtMobile ||  false

  
}

export default hmt_client_processor;