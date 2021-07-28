
export const successful_transaction_response = {
  "request_number":72,
  "ticket_key":"c1b5095f9558c36f39107d24f6bd6100",
  "msg":"Charge successful",
  "status":"ok"
};

export const successful_create_charge_worker_response = {
  "request_number":30,
  "worker_reference":"%2FS3TeYYkrTfYDrUEpZoOhAHcnydi3Oc44rFDEs%2BEKJDyCEh9d4pF5DvMW%2B9YtsN%2F",
  "msg":"charge worker created",
  "status":"ok"
}



export const successful_check_charge_worker_response = {
  "request_number":71,
  "worker":{
    "id":"288",
    "status":"done",
    "log":{
      "ticket_key":"4fde52cd892847de8cbc8d36e3d86727",
      "buyer":{
        "id":"2779236",
        "f_name":"test",
        "l_name":"test",
        "company_name":null,
        "address1":"test address 123",
        "address2":"",
        "city":"Albuquerque",
        "state":"NM",
        "zip":"87121",
        "phone":"",
        "email":"test@email.com",
        "date_approved":"2020-01-02 11:32:33",
        "trans_type":"credit",
        "transid":"026-3222237081",
        "ticket_key":"4fde52cd892847de8cbc8d36e3d86727",
        "sales_src":"mini",
        "l4":"1111",
        "cc_exp":"12\/2021",
        "rank":null
      },
      "buyers_data":[],
      "barcodes":[{"id":"10064519","event_id":"347327","buyer_id":"2779236","ticket_id":"329168","buyer_seat_id":"0","upc":"IQLTPCT6FGTKZM","name_on_ticket":null,"scan_alert":null,"parent_barcode_id":null,"ticket_desc":"21+ General Admission","price":"10.00","seat_zone":null,"seat_row":null,"seat_seat":null,"seat_x":null,"seat_y":null,"reusable":"","reusable_count":null,"child_event_limit":null,"delivery_method":"willcall","is_child_ticket":"n"}]
    }
  },
  "msg":"Worker status found",
  "status":"ok"
}

export const card_data = {
  payment_method: {
    credit_card: {
      address1: 'test address 123',
      email: 'joseph.perez@holdmyticket.com',
      full_name: 'test test',
      month: '12',
      number: '4111 1111 1111 1111',
      verification_value: '111',
      year: '2021',
      zip: '87121'
    }
  }
};


export const incorrect_transaction_survey_form_data = 'f_name=Joseph&l_name=Perez&email1=joseph.perez%40holdmyticket.com&email2=joseph.perez%40holdmyticket.com&newsletter=on&phone=55555555555&survey%5B348538%5D%5B1205611%5D%5B0%5D%5B%5D%5B0%5D=Male&survey%5B348538%5D%5B1205611%5D%5B0%5D%5B%5D%5B1%5D=Female&survey%5B348538%5D%5B1205612%5D%5B0%5D=30&survey%5B348538%5D%5B1205613%5D%5B0%5D=Television&survey%5B348538%5D%5B1205614%5D%5B0%5D=test%20value&survey%5B348538%5D%5B1205615%5D%5B0%5D=3&survey%5B348538%5D%5B1205616%5D%5B0%5D=Live%20Theater&survey%5B348538%5D%5B1205617%5D%5B0%5D=another%20test%20value&address1=test%20address%20123&address2=&city=Albuquerque&state_international=&state=NM&zip=87121&country_id=2&subscription_plan=&processor_hash=b81d1cea6ee1474dc8f6ff3cf5068f48&processor_method=spreedly&spreedly_environment_key=C1ZXiUWYZpg6yGn7XkRAwWOJLjp&cb_data%5Bticket_index%5D=0&payment_token=KGGyKKbTDryh2NgPj35xXqwLe1D';
export const correct_transaction_survey_form_data = 'f_name=Joseph&l_name=Perez&email1=joseph.perez%40holdmyticket.com&email2=joseph.perez%40holdmyticket.com&newsletter=on&phone=5555555555&sms=y&survey%5B348538%5D%5B1205611%5D%5B0%5D%5B%5D=Male&survey%5B348538%5D%5B1205611%5D%5B0%5D%5B%5D=Female&survey%5B348538%5D%5B1205612%5D%5B0%5D=30&survey%5B348538%5D%5B1205613%5D%5B0%5D=Television&survey%5B348538%5D%5B1205614%5D%5B0%5D=test%20value&survey%5B348538%5D%5B1205615%5D%5B0%5D=3&survey%5B348538%5D%5B1205616%5D%5B0%5D=Live%20Theater&survey%5B348538%5D%5B1205617%5D%5B0%5D=another%20test%20value&address1=test%20address%20123&address2=&city=Albuquerque&state_international=&state=NM&zip=87121&country_id=2&subscription_plan=&processor_hash=b81d1cea6ee1474dc8f6ff3cf5068f48&processor_method=spreedly&spreedly_environment_key=C1ZXiUWYZpg6yGn7XkRAwWOJLjp&cb_data%5Bticket_index%5D=0&payment_token=Y51rG0kAdBvO9HyEnCF0x1aYTQM';

export const transaction_data_with_survey = {
  f_name: "Joseph",
  l_name: "Perez",
  email1: "joseph.perez@holdmyticket.com",
  email2: "joseph.perez@holdmyticket.com",
  newsletter: "on",
  phone: "5555555555",
  sms: "y",
  "survey[348538][1205611][0][]": ["Male", "Female"],
  "survey[348538][1205612][0]": "30",
  "survey[348538][1205613][0]": "Television",
  "survey[348538][1205614][0]": "test value",
  "survey[348538][1205615][0]": "3",
  "survey[348538][1205616][0]": "Live Theater",
  "survey[348538][1205617][0]": "another test value",
  address1: "test address 123",
  address2: "",
  city: "Albuquerque",
  state_international: "",
  state: "NM",
  zip: "87121",
  country_id: "2",
  subscription_plan: "",
  processor_hash: "b81d1cea6ee1474dc8f6ff3cf5068f48",
  processor_method: "spreedly",
  spreedly_environment_key: "C1ZXiUWYZpg6yGn7XkRAwWOJLjp",
  cb_data: {ticket_index: "0"},
  payment_token: "Y51rG0kAdBvO9HyEnCF0x1aYTQM"
}

/*
SPREEDLY
=================================================
*/

export const spreedly_transaction_data = {
  address1: 'test address 123',
  address2: '',
  cb_data: { ticket_index: '0' },
  city: 'Albuquerque',
  country_id: '2',
  email1: 'joseph.perez@holdmyticket.com',
  email2: 'joseph.perez@holdmyticket.com',
  f_name: 'Joseph',
  l_name: 'Perez',
  newsletter: 'on',
  phone: '5555555555',
  processor_hash: '687597d047bbd8a5a29502a2231baa22',
  processor_method: 'spreedly',
  sms: 'y',
  spreedly_environment_key: 'C1ZXiUWYZpg6yGn7XkRAwWOJLjp',
  state: 'NM',
  state_international: '',
  subscription_plan: '',
  zip: '87121'
}

export const spreedly_payment_token = '6AGNdgkqzCHrruPdzzLD8Kisx69';

export const spreedly_token_response_success = {
  "transaction":{
    "token":"1pC3535FN8C46pQrRfIvlF6woZO",
    "created_at":"2019-12-06T18:26:42Z",
    "updated_at":"2019-12-06T18:26:42Z",
    "succeeded":true,
    "transaction_type":"AddPaymentMethod",
    "retained":false,
    "state":"succeeded",
    "message_key":"messages.transaction_succeeded",
    "message":"Succeeded!",
    "payment_method":{
      "token":"6AGNdgkqzCHrruPdzzLD8Kisx69",
      "created_at":"2019-12-06T18:26:42Z",
      "updated_at":"2019-12-06T18:26:42Z",
      "email":"joseph.perez@holdmyticket.com",
      "data":null,
      "storage_state":"cached",
      "test":true,
      "metadata":null,
      "callback_url":null,
      "last_four_digits":"1111",
      "first_six_digits":"411111",
      "card_type":"visa",
      "first_name":"test",
      "last_name":"test",
      "month":12,
      "year":2021,
      "address1":"test address 123",
      "address2":null,
      "city":null,
      "state":null,
      "zip":"87121",
      "country":null,
      "phone_number":null,
      "company":null,
      "full_name":"test test",
      "eligible_for_card_updater":true,
      "shipping_address1":null,
      "shipping_address2":null,
      "shipping_city":null,
      "shipping_state":null,
      "shipping_zip":null,
      "shipping_country":null,
      "shipping_phone_number":null,
      "payment_method_type":"credit_card",
      "errors":[],
      "fingerprint":"e3cef43464fc832f6e04f187df25af497994",
      "verification_value":"XXX",
      "number":"XXXX-XXXX-XXXX-1111"
    }
  }
}

export const spreedly_token_response_error = {
  "errors":[
    {
      "attribute":"month",
      "key":"errors.invalid",
      "message":"Month is invalid"
    }
  ]
}


/*
FULLSTEAM
=================================================
*/
export const fullsteam_transaction_data = {
  address1: 'test address 123',
  address2: '',
  cb_data: { ticket_index: '0' },
  city: 'Albuquerque',
  country_id: '2',
  email1: 'joseph.perez@holdmyticket.com',
  email2: 'joseph.perez@holdmyticket.com',
  f_name: 'Joseph',
  l_name: 'Perez',
  newsletter: 'on',
  phone: '5555555555',
  processor_hash: '7952dd2fb5cbc9ace7b8321b332a07a5',
  processor_method: 'fullsteam',
  sms: 'y',
  state: 'NM',
  state_international: '',
  subscription_plan: '',
  zip: '87121'
}

export const AVS_CODE = [87106];


export const fullsteam_authentication_key_response_success = {
  "authenticationKey":"d1236fd7-39a3-4022-9325-e2f93eff74e8",
  "status":"ok",
  "transid":"026-9903126867"
}

export const fullsteam_payment_token = '06aea257-28fa-487e-b0b3-59503d282c16';

export const fullsteam_token_response_success = {
  "token": "06aea257-28fa-487e-b0b3-59503d282c16",
  "issuerResponseDetails": {
    "issuerResponseCode": "00",
    "issuerResponseDescription": "Transaction Approved",
    "avsResponseCode": "Y",
    "avsResponseDescription": "Yes: Address and five-digit zip code match.",
    "cvvResponseCode": "M",
    "cvvResponseDescription": "Match",
    "processingNetwork": 1
  },
  "accountDetails": {
    "paymentMethod": 1,
    "cardBIN": "411111",
    "paymentAccountLast4": "1111",
    "nameOnAccount": "test test",
    "expirationMonth": 12,
    "expirationYear": 2021,
    "cardEntryMethod": 4
  },
  "actionGuid": "00594033-9ec5-494b-8201-ae53e4785324",
  "isSuccessful": true,
  "responseCode": 0,
  "responseDetails": [],
  "durationInMilliseconds": 932
}

