
export const successful_transaction_response = {
  "request_number":72,
  "ticket_key":"c1b5095f9558c36f39107d24f6bd6100",
  "msg":"Charge successful",
  "status":"ok"
};

/*
SPREEDLY
=================================================
*/
export const spreedly_card_data = {
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