
import Qs from 'qs';

var hmt_client_processor = function(settings){

  this.api_url = settings.api_url || '' // set when the script is loaded
  this.api_url_suffix = settings.api_url_suffix || '' // set when the script is loaded
  this.env = settings.env || '' // set when the script is loaded
  this.app_type = settings.app_type || '' // set prior to submit (online | box)
  this.isHmtMobile = settings.isHmtMobile || false
  this.auth = settings.app_type == 'box' && settings.auth || ''
  this.spreedly_environment_key = settings.spreedly_environment_key || ''
  this.charge_workers = settings.charge_workers || false
  this.captcha_token = settings.captcha_token || false

  this.errors_internal = [] // errors to handle internally
  this.errors_processing = [] // errors to send back to clients regarding processing status

  this.country_codes = {
    '2':'US','3':'AI','4':'AR','5':'AU','6':'AT','7':'BE','8':'BR','9':'CA','10':'CL','11':'C2','12':'CR','13':'CY','14':'CZ','15':'DK','16':'DO','17':'EC','18':'EE','19':'FI','20':'FR','21':'DE','22':'GR','23':'HK','24':'HU','25':'IS','26':'IN','27':'IE','28':'IL','29':'IT','30':'JM','31':'JP','32':'LV','33':'LT','34':'LU','35':'MY','36':'MT','37':'MX','38':'NL','39':'NZ','40':'NO','41':'PL','42':'PT','43':'SG','44':'SK','45':'SI','46':'ZA','47':'KR','48':'ES','49':'SE','50':'CH','51':'TW','52':'TH','53':'TR','54':'GB','55':'UY','56':'VE','57':'PE','58':'GT','59':'SL','60':'AL','61':'DZ','62':'AD','63':'AO','64':'AG','65':'AM','66':'AW','67':'AZ','68':'BS','69':'BH','70':'BB','71':'BZ','72':'BJ','73':'BM','74':'BT','75':'BO','76':'BA','77':'BW','78':'VG','79':'BN','80':'BG','81':'BF','82':'BI','83':'KH','84':'CV','85':'KY','86':'TD','87':'CO','88':'KM','89':'CK','90':'HR','91':'CD','92':'DJ','93':'DM','94':'SV','95':'ER','96':'ET','97':'FK','98':'FO','99':'FM','100':'FJ','101':'GF','102':'PF','103':'GA','104':'GM','105':'GI','106':'GL','107':'GD','108':'GP','109':'GN','110':'GW','111':'GY','112':'HN','113':'ID','114':'JO','115':'KZ','116':'KE','117':'KI','118':'KW','119':'KG','120':'LA','121':'LS','122':'LI','123':'MG','124':'MW','125':'MV','126':'ML','127':'MH','128':'MQ','129':'MR','130':'MU','131':'YT','132':'MN','133':'MS','134':'MA','135':'MZ','136':'NA','137':'NR','138':'NP','139':'AN','140':'NC','141':'NI','142':'NE','143':'NU','144':'NF','145':'OM','146':'PW','147':'PA','148':'PG','149':'PH','150':'PN','151':'QA','152':'CG','153':'RE','154':'RO','155':'RU','156':'RW','157':'VC','158':'WS','159':'SM','160':'ST','161':'SA','162':'SN','163':'SC','164':'SB','165':'SO','166':'LK','167':'SH','168':'KN','169':'LC','170':'PM','171':'SR','172':'SJ','173':'SZ','174':'TJ','175':'TZ','176':'TG','177':'TO','178':'TT','179':'TN','180':'TM','181':'TC','182':'TV','183':'UG','184':'UA','185':'AE','186':'VU','187':'VA','188':'VN','189':'WF','190':'YE','191':'ZM'
  }

  this.url = function(endpoint, use_suffix){
    return this.api_url + endpoint + (use_suffix ? this.api_url_suffix : '')
  }

  this.spreedly_url = function(spreedly_environment_key){
    return 'https://core.spreedly.com/v1/payment_methods.json?environment_key='+spreedly_environment_key
  }

  this.fullsteam_url = function(){
    return 'https://api'+(this.env == 'local' || this.env == 'dev' || this.env == 'staging' ? '-ext' : '')+'.fullsteampay.net/'
  }

  this.auth_key_url = function(){
    return 'shop/processors/get_authentication_key'
  }

  this.authnet_token_url = function() {
    return 'https://' + (this.env == 'local' || this.env == 'dev' || this.env == 'staging' ? 'apitest.authorize.net' : 'api2.authorize.net') + '/xml/v1/request.api';
  }

  /*
  PUBLIC FUNCTIONS
  */

  // main function that the client will call to submit transactions
  this.submit_transaction = function(card, transaction, cb){

    this._clear_state()

    transaction = this._prepare_transaction(transaction)

    var response = (result, cb, transaction) => {

      var error = !result ? true : false
      var res = result ? result : { status: 'error', errors: this.errors_processing }

      // just pass back the cb_data here, and not everywhere else
      if(transaction.cb_data)
        res.cb_data = transaction.cb_data

      // log the bad response here
      if(error)
        this._log_bad_trans(transaction)

      this._respond(error, res, cb)

    }

    // determine the method to use spreedly | fullsteam | authnet
    if(transaction.processor_method == 'spreedly'){
      this._submit_spreedly(card, transaction, cb).then((result) => {
        response(result, cb, transaction)
      })
    }else if(transaction.processor_method == 'fullsteam'){
      this._submit_fullsteam(card, transaction, cb).then((result) => {
        response(result, cb, transaction)
      })
    }else if(transaction.processor_method == 'authnet'){
      this._submit_authnet(card, transaction, cb).then((result) => {
        response(result, cb, transaction)
      })
    }else{
      this._add_internal_error('No processing method setup')
      response(false, cb, transaction)
    }

  }

  // public fn, calling internal so internal can be async
  this.save_card = function(card, transaction, processor, ticket_key){

    this._save_card(card, transaction, processor, ticket_key)

  }

  this.webuser_save_card = function(card, data, webuser_id, cb) {

    this._webuser_save_card(card, data, webuser_id, cb)

  }

  /*
  PRIVATE FUNCTIONS
  */

  /* SPREEDLY */

  this._get_spreedly_env_key = function(){

    if(this.spreedly_environment_key)
      return this.spreedly_environment_key

    return ''

  }

  this._submit_spreedly = async function(card, transaction){

    // saved payment tokens can be submitted without needing to create a token, simply submit payment token
    if (transaction.payment_token)
      return await this._submit_spreedly_transaction(transaction)

    // if no token, then lets get token from spreedly and
    var token_res = await this._get_spreedly_token(card, transaction.spreedly_environment_key)

    if(!token_res || !token_res.transaction || !token_res.transaction.payment_method || !token_res.transaction.payment_method.token) {
      if(!token_res){
        this._add_processing_error('Unable to charge card. Please check Adblocker / Firewall settings and try again.')
      }
      return this._add_internal_error('Spreedly, Could not get token');
    }

    transaction.payment_token = token_res.transaction.payment_method.token

    var transaction_res = await this._submit_spreedly_transaction(transaction)

    if(transaction_res && transaction_res.ticket_key)
      this._save_card_to_webuser({ticket_key: transaction_res.ticket_key})

    if(transaction.cc_retain && transaction.cc_retain == 'y')
      this._save_card(card, transaction, 'fullsteam')

    return transaction_res

  }

  this._get_spreedly_token = async function(card, spreedly_environment_key, cb){

    var token = await this._request({
      url: this.spreedly_url(spreedly_environment_key),
      type: 'POST',
      withCredentials: false,
      json: true,
      data: card
    })

    if(token.errors && token.errors.length > 0){
      for(var key in token.errors)
        this._add_processing_error(token.errors[key].message)
    }

    return token

  }

  this._submit_spreedly_transaction = async function(transaction, cb){

    if(transaction.payments)
      transaction.payments = this._update_payments_token(transaction.payments, transaction.payment_token)

    transaction = this._remove_sensitive_card_data(transaction)

    if (this.charge_workers) {
      var create_charge_worker_res = await this._request({
        url: this.url('shop/carts/create_charge_worker', true),
        type: 'POST',
        data: transaction,
        form_encoded: true,
        withCredentials: true
      });

      if (create_charge_worker_res.status == 'error')
        return this._add_processing_error('There was an error processing your transaction.');

      var transaction_res = await this._check_charge_worker(create_charge_worker_res.worker_reference);
    } else {
      var transaction_res = await this._request({
        url: this.url('shop/carts/submit', true),
        type: 'POST',
        data: transaction,
        form_encoded: true,
        withCredentials: true
      });
    }

    return transaction_res
  }

  /* FULLSTEAM */

  this._submit_fullsteam = async function(card, transaction, cb){

    // saved payment tokens can be submitted without needing to create a token, simply submit payment token
    if (transaction.payment_token)
      return await this._submit_fullsteam_transaction(transaction)

    var authentication_key_res = await this._get_auth_key()

    var auth_key = null

    if(authentication_key_res &&
      authentication_key_res.status &&
      authentication_key_res.status == 'ok' &&
      authentication_key_res.authenticationKey
    )
      auth_key = authentication_key_res.authenticationKey

    var token_res = await this._get_fullsteam_token(card, transaction, auth_key)

    if(!token_res || !token_res.isSuccessful)
      return false

    transaction.payment_token = token_res.token

    var transaction_res = await this._submit_fullsteam_transaction(transaction)

    if(transaction_res && transaction_res.ticket_key)
      this._save_card_to_webuser({ticket_key: transaction_res.ticket_key})

    if(transaction.cc_retain && transaction.cc_retain == 'y'){
      if(!transaction.spreedly_environment_key)
        transaction.spreedly_environment_key = this._get_spreedly_env_key()
      this._save_card(card, transaction, 'spreedly')
    }

    return transaction_res

  }

  this._get_auth_key = async function(transaction){
    //hit HMT servers to get a public key used for obtaining card token
    var processor_hash = transaction && transaction.processor_hash ? transaction.processor_hash : ''
    var params = {}
    if(this.captcha_token)
      params.captcha_token = this.captcha_token;
    if(processor_hash)
      params.processor_hash = processor_hash;

    var token_res = await this._request({
      url: this.url(this.auth_key_url(), true)+(params ? ('?' + Qs.stringify(params)) : ''),
      withCredentials: true
    })

    return token_res

  }

  this._get_fullsteam_token = async function(card, transaction, auth_key, cb){

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
      this._add_processing_error('Missing required card inputs')
      return false
    }

    var data = {
      "clearTextCardData": {
        "cardNumber": card.payment_method.credit_card.number.replace(/\s/g, ''),
        "cvv": card.payment_method.credit_card.verification_value,
        "expirationMonth": card.payment_method.credit_card.month,
        "expirationYear": card.payment_method.credit_card.year,
        "billingInformation": {
          "nameOnAccount": card.payment_method.credit_card.full_name,
          "firstName": transaction.f_name || null,
          "lastName": transaction.l_name || null,
          "address1": transaction.address1 || null,
          "address2": transaction.address2 || null,
          "city": transaction.city || null,
          "state": transaction.state || null,
          "zip": transaction.zip || (this.app_type  == 'box' ? '00000' : null),
          "country": this._get_fullsteam_contry_code(transaction),
          "phone": transaction.phone || null,
          "email": transaction.email1 || null,
        }
      },
      "cardEntryContext": this.app_type == 'box' ? 7 : 5,
      "performAccountVerification": true
    }

    if(transaction.country_id && transaction.country_id != '2')
      delete data.clearTextCardData.billingInformation.state

    var res = await this._request({
      url: this.fullsteam_url() + 'api/token/card/clearText/create',
      type: 'POST',
      cors: true,
      crossdomain: true,
      data: data,
      json: true,
      withCredentials : false,
      auth_key: auth_key
    })

    // handle any processing errors here
    if(!res || !res.isSuccessful){

      this._add_internal_error('Fullsteam, Could not get token')

      var msg = ''

      if(res && res.responseDetails){
        for(var key in res.responseDetails)
          this._add_processing_error(res.responseDetails[key].message)
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

          if(this.errors_processing.length > 0 && issuerResponseCode == '00') // we already have processing error, and there isn't a issuer error, so return...
            return false

          if(msg == '' && issuerResponseDescription && issuerResponseCode != '00')
            msg = "Error: "+issuerResponseDescription

          if(msg == '' && (!issuerResponseCode || issuerResponseCode == '00'))
            msg = "CPE2: Missing error code"

          if(msg == '')
            msg = "CPE3: Unknown issuer error"

        }

      }

      if(msg == '' && this.errors_processing.length == 0)
        msg = 'Unable to charge card. Please check Adblocker / Firewall settings and try again.' // CPE4 ERROR

      this._add_processing_error(msg)

      return false

    }

    return res

  }

  this._submit_fullsteam_transaction = async function(transaction, cb){

    if(transaction.payments)
      transaction.payments = this._update_payments_token(transaction.payments, transaction.payment_token)

    transaction = this._remove_sensitive_card_data(transaction)

    if (this.charge_workers) {
      var create_charge_worker_res = await this._request({
        url: this.url('shop/carts/create_charge_worker', true),
        type: 'POST',
        data: transaction,
        form_encoded: true,
        withCredentials: true
      });

      if (create_charge_worker_res.status == 'error')
        return this._add_processing_error('There was an error processing your transaction.');

      var transaction_res = await this._check_charge_worker(create_charge_worker_res.worker_reference);
    } else {
      var transaction_res = await this._request({
        url: this.url('shop/carts/submit', true),
        type: 'POST',
        data: transaction,
        form_encoded: true,
        withCredentials: true
      });
    }

    return transaction_res

  }

  this._get_fullsteam_contry_code = function(transaction){

    //country_id from HMT. return intnl country_code

    var hmt_country_id = transaction.country_id || '2'

    if(this.country_codes && this.country_codes[hmt_country_id])
      return this.country_codes[hmt_country_id]

    return 'US';

  }

  /* AUTHNET */
  this._submit_authnet = async function(card, transaction, cb){

    //This data
    transaction.card_data = {
      full_name: card.payment_method.credit_card.full_name,
      month: card.payment_method.credit_card.month,
      year: card.payment_method.credit_card.year
    }

    // saved payment tokens can be submitted without needing to create a token, simply submit payment token
    if (transaction.payment_token)
      return await this._submit_authnet_transaction(transaction)


    var authentication_key_res = await this._get_auth_key(transaction)


    if(!authentication_key_res.status ||
      authentication_key_res.status != 'ok' ||
      !authentication_key_res.auth_key)
      return false


    var token_res = await this._get_authnet_token(card, transaction, authentication_key_res)

    if(!this._is_valid_authnet_response(token_res))
      return false

    if(!token_res || !token_res.opaqueData || !token_res.opaqueData.dataValue){
      this._add_processing_error('Valid response data could not be found. Please try again.')
      return false
    }

    transaction.payment_token = token_res.opaqueData.dataValue

    var transaction_res = await this._submit_authnet_transaction(transaction)

    return transaction_res

  }

  this._is_valid_authnet_response = function(response){

    if(!response.messages || !response.messages.resultCode){
      this._add_processing_error('An unknown error has occurred. Please try again')
      return false
    }

    if(response.messages.resultCode === 'Error'){
      for (var i = 0; i < response.messages.message.length; i++)
        this._add_processing_error(response.messages.message[i].text)
      return false
    }

    return true
  }


  this._get_authnet_token = async function(card, transaction, auth, cb){

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
      this._add_processing_error('Missing required card inputs')
      return false
    }

    //Careful here - the ORDER of the variables is important to auth.net
    var authData = {};
      authData.name = auth.auth_user;
      authData.clientKey = auth.auth_key;
      
    var cardData = {};
      cardData.cardNumber = card.payment_method.credit_card.number.replace(/\s/g, '');
      cardData.expirationDate = this._get_authnet_expiration(card.payment_method.credit_card) 
      cardData.cardCode = card.payment_method.credit_card.verification_value;

    if(card.payment_method.credit_card.zip)
      cardData.zip = card.payment_method.credit_card.zip

    cardData.fullName = card.payment_method.credit_card.full_name;

    var anet_url = this.authnet_token_url();

    var post_data = {
      'securePaymentContainerRequest': {
        'merchantAuthentication' : authData,
        'data': {
          'type': 'TOKEN',
          'id': 'hmt_'+this.random_id(),          
          'token': cardData
        }
      }
    }

    var token_res = await this._request({
      url: anet_url,
      type: 'POST',
      data: post_data,
      json: true,
      form_encoded: false,
      withCredentials: false,      
      remote_url: true
    });

    return token_res;

  }

  this._get_authnet_expiration = function(card){
    return (card.month.length == 1 ? '0' : '')+card.month+(card.year.length == 2 ? '20' : '')+card.year
  }

  this.random_id = function(){
    var res = ''; 
    var arr = '1234567890'
    for (var i = 16; i > 0; i--) { 
        res += arr[Math.floor(Math.random() * arr.length)]; 
    } 
    return res; 
  }


  this._submit_authnet_transaction = async function(transaction, cb){
    if (transaction.payments)
      transaction.payments = this._update_payments_token(transaction.payments, transaction.payment_token)

    transaction = this._remove_sensitive_card_data(transaction)

    if (this.charge_workers) {
      var create_charge_worker_res = await this._request({
        url: this.url('shop/carts/create_charge_worker', true),
        type: 'POST',
        data: transaction,
        form_encoded: true,
        withCredentials: true
      });

      if (create_charge_worker_res.status == 'error')
        return this._add_processing_error('There was an error processing your transaction.');

      var transaction_res = await this._check_charge_worker(create_charge_worker_res.worker_reference);
    } else {
      var transaction_res = await this._request({
        url: this.url('shop/carts/submit', true),
        type: 'POST',
        data: transaction,
        form_encoded: true,
        withCredentials: true
      });
    }

    return transaction_res
  }

  this._get_authnet_contry_code = function(transaction){}

  /* Card Saving Fns */

  this._save_card = async function(card, transaction, processor, ticket_key){

    if(!card || !card.payment_method || !card.payment_method.credit_card)
      return

    var card_data = card.payment_method.credit_card

    var args = {card: card_data, processor: processor}

    ticket_key = ticket_key || ''
    if(ticket_key)
      args.ticket_key = ticket_key

    if(processor == 'spreedly'){

      var token_res = await this._get_spreedly_token(card, transaction.spreedly_environment_key)

      if(!token_res)
        return;

      if(token_res.transaction && token_res.transaction.payment_method && token_res.transaction.payment_method.token)
        args.token = token_res.transaction.payment_method.token

      this._save_card_to_webuser(args);

    }

    if(processor == 'fullsteam'){

      var authentication_key_res = await this._get_auth_key()

      var env_key = null

      if(authentication_key_res && authentication_key_res.status && authentication_key_res.status == 'ok' && authentication_key_res.authenticationKey)
        env_key = authentication_key_res.authenticationKey

      if(!env_key)
        return

      const token_res = await this._get_fullsteam_token(card, transaction, env_key);

      if(!token_res || !token_res.isSuccessful || !token_res.token)
        return

      args.token = token_res.token;

      this._save_card_to_webuser(args);

    }

  }

  this._save_card_to_webuser = async function(args){

    this._remember_card_data(args)

    var card_data = this.card_data ? this._format_card_for_save(this.card_data) : null

    if(this.card_ticket_key && card_data && this.card_token && this.card_processor){

      var data = {
        ticket_key: this.card_ticket_key,
        vault: this.card_processor,
        token: this.card_token,
        card_data: card_data
      }

      var res = await this._request({
        url: this.url('public/orders/save_additional_card', false),
        type: 'POST',
        withCredentials : false,
        data: data,
        form_encoded: true
      })

    }

  }

  this._webuser_save_card = async function(card, data, webuser_id, cb) {

    var res = {}

    var spreedly_token_res = await this._get_spreedly_token(card, data.spreedly_environment_key)

    if (!spreedly_token_res || !spreedly_token_res.transaction || !spreedly_token_res.transaction.payment_method || !spreedly_token_res.transaction.payment_method.token) {
      if (!this.errors_processing && !this.errors_internal)
        this._add_internal_error('Spreedly, Could not get token')

      this._respond(this.errors_processing, spreedly_token_res, cb)
      return
    }

    var request_data = {
      webuser_id: webuser_id,
      token: spreedly_token_res.transaction.payment_method.token,
      vault: 'spreedly'
    };

    if(data.ticket_key)
      request_data.ticket_key = data.ticket_key

    var save_credit_card_res = await this._request({
      url: this.url('public/users/save_credit_card', false),
      type: 'POST',
      withCredentials: this.isHmtMobile ? true : false,
      data: request_data,
      form_encoded: true
    })


    if(save_credit_card_res && save_credit_card_res.status == 'ok' && save_credit_card_res.statusText == 'OK')
      res = save_credit_card_res // this will be the successfull res!

    if(!save_credit_card_res || !save_credit_card_res.status || save_credit_card_res.status != 'ok') {

      if(save_credit_card_res && save_credit_card_res.msg)
        this._add_processing_error(save_credit_card_res.msg)

      if(!this.errors_processing && !this.errors_internal)
        this._add_internal_error('Spreedly, Error saving credit card')

      this._respond(this.errors_processing, spreedly_token_res, cb)
      return
    }

    var authentication_key_res = await this._get_auth_key()

    var env_key = null;

    if(
      authentication_key_res &&
      authentication_key_res.status &&
      authentication_key_res.status == 'ok' &&
      authentication_key_res.authenticationKey
    )
      env_key = authentication_key_res.authenticationKey;

    if(!env_key) {
      if(!this.errors_processing && !this.errors_internal)
        this._add_internal_error('Fullsteam, Could not get env_key');

      this._respond(this.errors_processing, authentication_key_res, cb)
      return
    }

    if(!data.zip && card.payment_method.credit_card.zip)
      data.zip = card.payment_method.credit_card.zip

    var fullsteam_token_res = await this._get_fullsteam_token(card, data, env_key)

    if(!fullsteam_token_res || !fullsteam_token_res.isSuccessful || !fullsteam_token_res.token) {
       // _get_fullsteam_token throws internal error for: !fullsteam_token_res || !fullsteam_token_res.isSuccessful
      if(fullsteam_token_res && !fullsteam_token_res.token) // throw internal error when there is a fullsteam_token_res, but no token
        this._add_internal_error('Fullsteam, Responded with no token')

      this._respond(this.errors_processing, authentication_key_res, cb)
      return
    }

    var card_data = card.payment_method.credit_card
      ? this._format_card_for_save(card.payment_method.credit_card)
      : null;

    var additional_request_data = {
      webuser_id: webuser_id,
      vault: 'fullsteam',
      token: fullsteam_token_res.token,
      card_data: card_data
    };

    if(data.ticket_key)
      additional_request_data.ticket_key = data.ticket_key

    var save_additional_card_res = await this._request({
      url: this.url('public/users/save_additional_card', false),
      type: 'POST',
      withCredentials: this.isHmtMobile ? true : false,
      data: additional_request_data,
      form_encoded: true
    });

    if(!save_additional_card_res || !save_additional_card_res.status || save_additional_card_res.status != 'ok') {
      //do not set error here - we will let if fail silently (we at least saved 1 vault)

      if (!this.errors_processing && !this.errors_internal)
        this._add_internal_error('Fullsteam, Error saving additional credit card')

      this._respond(this.errors_processing, save_credit_card_res, cb)
      return
    }

    this._respond(this.errors_processing, res, cb);

  }


  /*
  Utilities
  */

  this._check_charge_worker = async function(worker_reference) {
    return new Promise((resolve) => {

      const check_charge = async () => {
        var check_charge_worker_res = await this._request({
          url: this.url('shop/carts/get_charge_worker_status/' + worker_reference, true),
          withCredentials: true
        });

        if (
          check_charge_worker_res.status == 'ok' &&
          (check_charge_worker_res.worker.status == 'waiting' || check_charge_worker_res.worker.status == 'running')
        ) {
          setTimeout(check_charge, 5000)
        }

        if (check_charge_worker_res.status == 'ok' && check_charge_worker_res.worker.status == 'done') {
          resolve({
            status: 'ok',
            msg: 'Charge successful',
            ticket_key: check_charge_worker_res.worker.log.ticket_key
          });
        }

        if (check_charge_worker_res.status == 'ok' && check_charge_worker_res.worker.status == 'terminated') {
          resolve({
            status: 'error',
            msg: 'There was an error processing your transaction.'
          });
        }

        if (check_charge_worker_res.status == 'ok' && check_charge_worker_res.worker.status == 'error') {
          resolve({
            status: check_charge_worker_res.worker.log.status,
            msg: check_charge_worker_res.worker.log.msg
          });
        }
      }

      check_charge();
    });
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
      last_four : this._get_last_four(card_data.number),
      exp_month : card_data.month,
      exp_year : card_data.year,
    }

  }

  this._format_phone_number = function(phone_number) {

    // \D stands for any non digit
    return phone_number.replace(/\D/g, '');

  }

  this._get_last_four = function(cc_num){

    return cc_num.substr(cc_num.length - 4)

  }

  this._remember_card_data = function(args){

    if(args.card)
      this.card_data = args.card
    if(args.token)
      this.card_token = args.token
    if(args.processor)
      this.card_processor = args.processor
    if(args.ticket_key)
      this.card_ticket_key = args.ticket_key

  }

  this._clear_state = function(){

    this.errors_internal = []
    this.errors_processing = []

    delete this.card_data
    delete this.card_token
    delete this.card_processor
    delete this.card_ticket_key

  }

  this._remove_sensitive_card_data = function(data){

    delete data.cc_no
    delete data.cc_cvc
    delete data.cc_expiry
    delete data.cc_name
    delete data.encryptedTrack1
    delete data.encryptedTrack2
    delete data.ksn

    return data

  }

  /*
  Main Request Fn
  */

  this._request = async function(opts){

    return new Promise((resolve, reject) => {

      // default
      var headers = {}

      if(opts.json)
        headers['content-type'] = 'application/json;charset=UTF-8'

      if(opts.form_encoded){
        headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8'

        if (opts.data.payments) {

          var payments = opts.data.payments;
          delete opts.data.payments;

          var stringifiedPostData = this._serializer(opts.data);
          var stringifiedPayments = this._serializer({ payments: payments }, true);
          stringifiedPostData = stringifiedPostData + '&' + stringifiedPayments;

        } else {

          var stringifiedPostData = this._serializer(opts.data);

        }

        opts.data = stringifiedPostData;

      }

      if(opts.auth_key)
        headers['authenticationKey'] = opts.auth_key

      var url = opts.url

      var data

      if(opts.data)
        data = opts.data

      if(this.auth && this.app_type == 'box' && (url.indexOf('submit') > -1 || url.indexOf('get_authentication_key') > -1)){
        url += (url.indexOf('?') > -1 ? '&' : '?') + 'auth='+this.auth
        if(typeof data == 'object')
          data.can_handle_fullsteam = 'true'
        if(typeof data == 'string')
          data += '&can_handle_fullsteam=true'
      }

      if(opts.remote_url)
        url = opts.url
      else
        headers['processor-compat-ver'] = '1'

      if(opts.json)
        data = JSON.stringify(data)

      // build the xhr request
      var xhr = new XMLHttpRequest();
      xhr.open(opts.type || 'GET', url);
      xhr.withCredentials = opts.withCredentials || false;

      for(var key in headers)
        xhr.setRequestHeader(key, headers[key])

      xhr.onreadystatechange = (evt) => {

        if (xhr.readyState === 4){

          this._logger(url, data, xhr, opts)

          if (xhr.status && xhr.status >= 200 && xhr.status <= 299)
            resolve(this._xhr_success(xhr))
          else
            resolve(this._xhr_fail(xhr, url))

        }

      }

      xhr.send(data)

    })

  }

  /*
  Request Responses
  */

  this._xhr_success = function(xhr){

    var res = {}

    try {
      res = JSON.parse(xhr.responseText)
    } catch(error) {
      console.log('could not parse the response to json')
    }

    // attempt to set statusText
    if(xhr.statusText)
      res.statusText = xhr.statusText

    // react native seems to have a bug where the statusText comes through as undefined
    // to get around it we'll set the prop manually for status 200 so we can pass any checks for it in the lib
    if (this.isHmtMobile && !res.statusText)
      res.statusText = 'OK';

    return res

  }

  this._xhr_fail = function(xhr, url){

    // var error = null

    // try {
    //   error = JSON.parse(xhr.response)
    // } catch(error) {
    //   console.log('could not parse error response')
    // }

    var res = {}

    try {
      res = JSON.parse(xhr.responseText)
    } catch(error) {
      console.log('xhr error', error)
      console.log('could not parse the response to json', xhr)
    }

    if(!res.status && res.status !== 'error')
     res.status = 'error'

    res.statusText = xhr.statusText ? xhr.statusText : 'ERROR'

    return res

  }

  this._respond = function(err, res, cb){

    if(err || !res || res.status == 'error'){
      this._throw_error(err, res, cb)
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

  this._logger = function(url, data, xhr, opts){

    try {

      var d = {}

      if(data && opts.json && typeof data == 'string')
        d = JSON.parse(data)

      if(d.clearTextCardData && d.clearTextCardData.cvv)
        delete d.clearTextCardData.cvv

      if(d.payment_method && d.payment_method.credit_card && d.payment_method.credit_card.verification_value)
        delete d.payment_method.credit_card.verification_value

      var log = this._prepare_for_log({
        url: url,
        data: d,
        xhr: { // had to define these, can't stringify the raw xhr
          readyState: xhr.readyState ? xhr.readyState : null,
          response: xhr.response ? xhr.response : null,
          responseText: xhr.responseText ? xhr.responseText : null,
          responseURL: xhr.responseURL ? xhr.responseURL : null,
          responseXML: xhr.responseXML ? xhr.responseXML : null,
          status: xhr.status ? xhr.status : null,
          statusText: xhr.statusText ? xhr.statusText : null,
          timeout: xhr.timeout ? xhr.timeout : null
        },
        browser_info: this._get_browser_info()
      })

      var xhr = new XMLHttpRequest();
      xhr.open('POST', this.url('shop/processors/logme2342311', true), true);
      xhr.withCredentials = true
      xhr.setRequestHeader('content-type', 'application/json;charset=UTF-8')
      xhr.send(JSON.stringify(log))

    } catch(error) {
      // console.error so we can reference this in FullStory
      console.error('CPE7 Logger Error', error);
    }

  }

  this._log_bad_trans = function(transaction){

    try {

      // cloning object, so no ref
      var t = transaction ? this._copy_object(transaction) : null

      // delete survey data && change the way we send over renewable array, else we get Disallowed Key Characters from Code Igniter
      for(var key in t){
        if(key.indexOf('survey') > -1) delete t[key]

        if(key.indexOf('renewable') > -1 && t[key].length > 0){
          var renewable_copy = JSON.parse(JSON.stringify(key))
          delete t[key]

          var renewable_ticket_key = renewable_copy.match(/\[(.*?)\]/)[1]
          t.renewable = {}
          t.renewable[renewable_ticket_key] = 'y'

        }
      }

      var d = { form_data: t, transaction: t }

      d.form_data.errors_internal = this.errors_internal
      d.form_data.errors_processing = this.errors_processing

      if(!d.transaction.processor)
        d.transaction.processor = { merch_gateway: transaction.processor_method ? transaction.processor_method : null }
      d.transaction.error_msg = this.errors_processing.join("\n")

      var xhr = new XMLHttpRequest();
      xhr.open('POST', this.url('shop/carts/log_bad_trans', true), true);
      xhr.withCredentials = true
      xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
      xhr.send(this._serializer(d))

    } catch(error) {

      console.warn('Could not log bad trans: ', error)

    }

  }

  this._prepare_for_log = function(data){

    var str = JSON.stringify(data)

    // mask cc data
    str = str.replace(/\b(?:\d{4}[ -]?){3}(?=\d{4}\b)/gm, `**** **** **** `)

    return str

  }

  this._get_browser_info = function() {

    if(this.isHmtMobile)
      return { platform: 'hmtMobile' }

    return {
      platform: navigator && navigator.platform ? navigator.platform : '',
      userAgent: navigator && navigator.userAgent ? navigator.userAgent : '',
      vendor: navigator && navigator.vendor ? navigator.vendor : '',
      vendorSub: navigator && navigator.vendorSub ? navigator.vendorSub : '',
    }

  }

  // deep serialize object to form data
  this._serializer = function(obj, serialize_without_repeat){

    var qs_opts = serialize_without_repeat ? {} : { arrayFormat: 'repeat'}

    return Qs.stringify(obj, qs_opts);


    // var pairs = [];
    // for (var prop in obj) {
    //     if (!obj.hasOwnProperty(prop)) {
    //         continue;
    //     }
    //     if (Object.prototype.toString.call(obj[prop]) == '[object Object]') {
    //         pairs.push(this._serializer(obj[prop]));
    //         continue;
    //     }
    //     pairs.push(prop + '=' + obj[prop]);
    // }
    //
    // return pairs.join('&');

  }

  // prepare the transaction data prior to submitting
  this._prepare_transaction = function(transaction){

    // removing all phone special chars. Only allow numbers
    if (transaction.phone)
      transaction.phone = this._format_phone_number(transaction.phone);

    //we need to make sure old versions of lib work, so API sends new prop
    if(transaction.new_processor_method)
      transaction.processor_method = transaction.new_processor_method;

    return transaction

  }

  // add a internal error
  this._add_internal_error = function(err){
    this.errors_internal.push(err)
    return false
  }

  // add a processing error
  this._add_processing_error = function(err){
    this.errors_processing.push(err)
    return false
  }

  this._copy_object = function(obj){

    try {
      if(typeof obj != 'object')
        return false
      return JSON.parse(JSON.stringify(obj))
    } catch(error) {
      return false
    }

  }

}

export default hmt_client_processor;
