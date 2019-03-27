
var hmt_client_processor = {

  env: 'local',

  url_prefix: function(endpoint){
    
    if(this.env == 'local')
      return 'http://holdmyticket.loc/'+endpoint
    if(this.env == 'dev')
      return 'https://dev.holdmyticket.com/'+endpoint
    if(this.env == 'production')
      return 'https://holdmyticket.com/'+endpoint
    
  },
  
  spreedly_url: function(spreedly_environment_key){
    return 'https://core.spreedly.com/v1/payment_methods.json?environment_key='+spreedly_environment_key
  },
  
  fullsteam_url: function(){
    return 'https://tempintegration-fullsteam-api.azurewebsites.net/'
  },
  
  submit_transaction: function(method, card, transaction, spreedly_environment_key, cb){
    
    // determine the method to use spreedly | fullsteam
    
    if(method == 'spreedly')  
      this._submit_spreedly(card, transaction, spreedly_environment_key, cb)
    else if(method == 'fullsteam')
      this._submit_fullsteam(card, transaction, cb)
      
  },
  
  _submit_spreedly: function(card, transaction, spreedly_environment_key, cb){
    
    var me = this
    
    me._get_spreedly_token(card, spreedly_environment_key, function(err, token_res){
      
      if(err) {
        if(cb) cb(err)
        return;
      }

      var token = token_res.transaction.payment_method.token

      me._submit_spreedly_transaction(token, transaction, spreedly_environment_key, function(err, transaction_res){
        
        hmt_client_processor._respond(err, transaction_res, cb)
        
      })
      
    })
    
  },
  
  _submit_spreedly_transaction(token, transaction, spreedly_environment_key, cb){

    transaction.payment_token = token

    this._request({
      url: this.url_prefix('api/shop/carts/submit'),
      type: 'POST',
      data: transaction,
      cb: function(err, json){
        
        hmt_client_processor._respond(err, json, cb)

      }
    })
    
  },
  
  _submit_fullsteam: function(){
    
    var me = this
    
    me._get_fullsteam_auth_key(function(err, authentication_key_res){
      
      var fullsteam_authentication_key = authentication_key_res.status == 'ok' ? authentication_key_res.authenticationKey : null
      
      // TODO validate the key
    
      me._get_fullsteam_token(card, fullsteam_authentication_key, function(err, token_res){
        
        me._submit_fullsteam_transaction(card, transaction, fullsteam_authentication_key, function(err, transaction_res){
          
          
          
        })
        
      })

    })

  },
  
  _get_fullsteam_auth_key: function(cb){
    
    this._request({
      url: this.url_prefix('api/shop/processors/get_authentication_key'),
      cb: function(err, res){
        hmt_client_processor._respond(err, res, cb)
      }
    })
    
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
  
  _get_fullsteam_token: function(cb){
    
  },
  
  _request: function(opts){
    
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
    	// Only run if the request is complete
    	if (xhr.readyState !== 4) return;
    	// Process our return data
    	if (xhr.status >= 200 && xhr.status < 300) {
    		// What do when the request is successful
    		opts.cb(null, JSON.parse(xhr.responseText));
    	} else {
    		// What to do when the request has failed
    		opts.cb(xhr);
    	}

    };

    xhr.open(opts.type || 'GET', opts.url);

    var data = null

    if(opts.data){
      data = hmt_client_processor._jsonToFormData(opts.data)
      console.log('data', data)
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      // xhr.setRequestHeader('Content-type', 'application/json');
      // xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    }
    
    xhr.send(data);
    
  },
  
  _respond: function(err, res, cb){
    
    if(err)
      if(cb) cb(err)
    
    if(cb)
      cb(null, res)
    
  },
  
  // _jsonToFormData: function (inJSON, inTestJSON, inFormData, parentKey) {
  //   // http://stackoverflow.com/a/22783314/260665
  //   // Raj: Converts any nested JSON to formData.
  //   var form_data = inFormData || new FormData();
  //   var testJSON = inTestJSON || {};
  //   for ( var key in inJSON ) {
  //       // 1. If it is a recursion, then key has to be constructed like "parent.child" where parent JSON contains a child JSON
  //       // 2. Perform append data only if the value for key is not a JSON, recurse otherwise!
  //       var constructedKey = key;
  //       if (parentKey) {
  //           constructedKey = parentKey + "." + key;
  //       }
  // 
  //       var value = inJSON[key];
  //       if (value && value.constructor === {}.constructor) {
  //           // This is a JSON, we now need to recurse!
  //           hmt_client_processor._jsonToFormData (value, testJSON, form_data, constructedKey);
  //       } else {
  //           form_data.append(constructedKey, inJSON[key]);
  //           testJSON[constructedKey] = inJSON[key];
  //       }
  //   }
  //   return form_data;
  // }
  
}