import axios from 'axios';

var hmt_client_processor = {

  api_url: '', // set when the script is loaded
  
  app_type: '', // set prior to submit (online | box)

  current_processor: '',

  url_prefix: function(endpoint){

    return this.api_url + endpoint

  },
  
  spreedly_url: function(spreedly_environment_key){

    return 'https://core.spreedly.com/v1/payment_methods.json?environment_key='+spreedly_environment_key
    
  },
  
  fullsteam_url: function(){

    return 'https://api-ext.fullsteampay.net/'

  },
  
  submit_transaction: function(card, transaction, cb){
    this._remove_card_data()
    // determine the method to use spreedly | fullsteam    

    if(transaction.processor_method == 'spreedly')
      this._submit_spreedly(card, transaction, cb)
    else if(transaction.processor_method == 'fullsteam')
      this._submit_fullsteam(card, transaction, cb)
    else
      this._throw_error(true, {status: 'error', msg: 'No processing method setup'}, cb)
      
  },
  
  /* SPREEDLY */
  
  _submit_spreedly: function(card, transaction, cb){    

    var me = this
    me.current_processor = 'spreedly'

    if (transaction.payment_token) {
      me._submit_spreedly_transaction(transaction, function(err, transaction_res) {
				// if (!err && transaction_res.ticket_key) me._save_card_to_webuser({ ticket_key: transaction_res.ticket_key });

				hmt_client_processor._respond(err, transaction_res, cb);
			});
    } else {
      me._get_spreedly_token(card, transaction.spreedly_environment_key, function(err, token_res){

        if(err) {
          hmt_client_processor._throw_error(err, token_res, cb)
          return;
        }
  
        transaction.payment_token = token_res.transaction.payment_method.token
        
        me._submit_spreedly_transaction(transaction, function(err, transaction_res){
          
          if(!err && transaction_res.ticket_key)
            me._save_card_to_webuser({ticket_key: transaction_res.ticket_key})
  
          hmt_client_processor._respond(err, transaction_res, cb)
          
        })
        
      })
    }

    if(transaction.cc_retain && transaction.cc_retain == 'y')
        me.save_card(card, transaction, 'fullsteam')
    
  },
  
  _get_spreedly_token: function(card, spreedly_environment_key, cb){

    this._request({
      url: this.spreedly_url(spreedly_environment_key),
      type: 'POST',
      withCredentials: false,
      data: card,
      cb: function(err, res){
        hmt_client_processor._respond(err, res, cb)
      }
    })
    
  },
  
  _submit_spreedly_transaction: function(transaction, cb){

    this._request({
      url: this.url_prefix('shop/carts/submit'),
      type: 'POST',
      data: transaction,
      form_encoded: true,
      withCredentials: true,
      cb: function(err, json){
        hmt_client_processor._respond(err, json, cb)
      }
    })
    
  },
  
  /* FULLSTEAM */
  
  _submit_fullsteam: function(card, transaction, cb){
    
    var me = this
    me.current_processor = 'fullsteam'

    if (transaction.payment_token) {

      me._submit_fullsteam_transaction(transaction, function(err, transaction_res){
        console.log('submit_fullsteam res', err, transaction_res)
        
        hmt_client_processor._respond(err, transaction_res, cb)
    
      })

    } else {
      me._get_fullsteam_auth_key(function(err, authentication_key_res){

        var auth_key = null
        
        if(authentication_key_res && authentication_key_res.status && authentication_key_res.status == 'ok' && authentication_key_res.authenticationKey)
          auth_key = authentication_key_res.authenticationKey
        
        // TODO validate the key
        
        me._get_fullsteam_token(card, transaction, auth_key, function(err, token_res){
          
          // TODO validate the token
          
          if(!token_res || !token_res.isSuccessful || !token_res.token)
            return hmt_client_processor._handle_fullsteam_error(token_res, cb)
  
          transaction.payment_token = token_res.token
        
          me._submit_fullsteam_transaction(transaction, function(err, transaction_res){
            console.log('submit_fullsteam res', err, transaction_res)
  
            if(!err && transaction_res.ticket_key)
              me._save_card_to_webuser({ticket_key: transaction_res.ticket_key})
            
            hmt_client_processor._respond(err, transaction_res, cb)
        
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

  },

  _get_spreedly_env_key: function(){
    if(this.spreedly_environment_key)
      return this.spreedly_environment_key

    if(config && config.spreedly_environment_key)
      return config.spreedly_environment_key

    return ''
  },

  save_card: function(card, transaction, processor, ticket_key){
    var me = this

    console.log("SAVE CARD", card, transaction, ticket_key)

    if(!card || !card.payment_method || !card.payment_method.credit_card)
      return

    var card_data = card.payment_method.credit_card

    var args = {card: card_data, processor: processor}

    ticket_key = ticket_key || ''
    if(ticket_key)
      args.ticket_key = ticket_key

    if(processor == 'spreedly'){
      me._get_spreedly_token(card, transaction.spreedly_environment_key, function(err, token_res){
        console.log('spreedly token result', err, token_res)
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

  },

  webuser_save_card: function(card, data, webuser_id, cb) {
		var me = this;

		me._get_spreedly_token(card, data.spreedly_environment_key, function(err, token_res) {
			console.log('spreedly token result', err, token_res);
			if (err) {
				return;
			}

			var request_data = {
				webuser_id: webuser_id,
				token: token_res.transaction.payment_method.token,
				vault: 'spreedly'
			};

			me._request({
				url: me.url_prefix('public/users/save_credit_card'),
				type: 'POST',
				withCredentials: false,
				data: request_data,
				form_encoded: true,
				cb: function(err, res) {
					console.log('err,res', err, res);

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

						me._get_fullsteam_token(card, data, env_key, function(err, token_res) {
							if (!token_res || !token_res.isSuccessful || !token_res.token) return;

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
								url: me.url_prefix('public/users/save_additional_card'),
								type: 'POST',
								withCredentials: false,
								data: data,
								form_encoded: true,
								cb: function(err, res) {
									console.log('err,res', err, res);
									hmt_client_processor._respond(err, res, cb);
								}
							});
						});
					});
				}
			});
		});
	},

  _save_card_to_webuser: function(args){
    var me = this

    console.log("ARGS", args)

    me._remember_card_data(args)

    var card_data = me.card_data ? me._format_card_for_save(me.card_data) : null

    if(me.card_ticket_key && card_data && me.card_token && me.card_processor){
      console.log('card_data checks PASSED', card_data)

      var data = {
        ticket_key: me.card_ticket_key,
        vault: me.card_processor,
        token: me.card_token,
        card_data: card_data
      }

      this._request({
        url: me.url_prefix('public/orders/save_additional_card'),
        type: 'POST',
        withCredentials: false,
        data: data,
        form_encoded: true,
        cb: function(err, res){
          console.log('err,res', err, res)
          // hmt_client_processor._respond(err, res, cb)
        }
      })
    }

  },

  _format_card_for_save: function(card_data){
    var me = this
    console.log("card_data", card_data)
    
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
  },

  _get_last_four: function(cc_num){
    return cc_num.substr(cc_num.length - 4)
  },

  _remember_card_data: function(args){
    var me = this

    if(args.card)
      me.card_data = args.card
    if(args.token)
      me.card_token = args.token
    if(args.processor)
      me.card_processor = args.processor
    if(args.ticket_key)
      me.card_ticket_key = args.ticket_key
  },

  _remove_card_data: function(){
    var me = this

    delete me.card_data
    delete me.card_token
    delete me.processor
    delete me.card_ticket_key
  },
  
  _get_fullsteam_auth_key: function(cb){
    
    this._request({
      url: this.url_prefix('shop/processors/get_authentication_key'),
      cb: function(err, res){
        hmt_client_processor._respond(err, res, cb)
      }
    })
    
  },

  _get_fullsteam_token: function(card, transaction, auth_key, cb){
    console.log('TRANSACTION', transaction)
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
      // "avsOptions": { // these are sent over during get auth key
      //   "action": 1,
      //   "codes": [
      //     'B',
  		// 		'C',
  		// 		'D',
  		// 		'F',
  		// 		'G',
  		// 		'I',
  		// 		'J',
  		// 		'K',
  		// 		'M',
  		// 		'P',
  		// 		'S',
  		// 		'T',
  		// 		'U',
  		// 		'W',
  		// 		'Y',
  		// 		'Z'
      //   ]
      // },
      // "cvvOptions": { // these are sent over during get auth key
      //   "action": 1,
      //   "codes": [
      //     "M",
      //     "P"
      //   ]
      // },
      "performAccountVerification": true
      // "customerId": "string"
    }
    
    this._request({
      url: this.fullsteam_url() + 'api/token/card/clearText/create',
      type: 'POST',
      cors: true,
      crossdomain: true,
      data: data,
      json: true,
      withCredentials: false,
      auth_key: auth_key,
      cb: function(err, res){
        hmt_client_processor._respond(err, res, cb)
      }      
    })

  },
  
  _submit_fullsteam_transaction: function(transaction, cb){
    
    this._request({
      url: this.url_prefix('shop/carts/submit'),
      type: 'POST',
      data: transaction,
      form_encoded: true,
      withCredentials: true,
      cb: function(err, json){
        hmt_client_processor._respond(err, json, cb)
      }
    })
    
  },
  
  _request: function(opts){

    // default
    var headers = {}
    
    if(opts.json)
      headers['content-type'] = 'application/json;charset=UTF-8'
    
    if(opts.form_encoded){
      headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
      opts.data = hmt_client_processor._serialize(opts.data)
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
      
      if(opts.cb)
        opts.cb(null, response)
      
    }).catch(function(error, res){

      var error_msg = hmt_client_processor._format_error(error)
      if(!res)
        res = {}

      res.msg = error_msg

      if(opts.cb)
        opts.cb(error, res)
      
    });
    
  },

  _format_error: function(error) {
    if(this.current_processor == 'spreedly'){
      return this._format_spreedly_error(error)
    } else {
      return this._format_fullsteam_error(error)
    }
  },

  _format_spreedly_error: function(error){
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

  },

  _format_fullsteam_error: function(error){
    return error && error.msg ? error.msg : 'Unkown error'
  },
  
  _handle_fullsteam_error: function(res, cb){
    
    var msg = ''
    
    if(res && res.responseDetails){
      for(key in res.responseDetails)
        msg += res.responseDetails[key].message+"\n\n"
    }
    
    return hmt_client_processor._throw_error(true, {msg: msg}, cb)
    
  },
  
  _respond: function(err, res, cb){
    
    if(err || !res || !res.data || res.status == 'error'){
      hmt_client_processor._throw_error(err, res, cb)
      return
    }

    if(cb)
      cb(null, res.data)
    
  },
  
  _throw_error: function(err, res, cb){
        
    if(!err && res.msg)
      err = res.msg
    
    if(!err)
      err = true
    
    if(cb)
      cb(err, res)
    
  },
  
  _serialize: function(obj) {
    
    var str = [], p, prefix;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p,
          v = obj[p];
        str.push((v !== null && typeof v === "object") ?
          hmt_client_processor._serialize(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
    
  }
  
}

export default hmt_client_processor;