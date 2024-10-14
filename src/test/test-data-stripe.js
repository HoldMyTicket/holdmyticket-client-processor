/*
STRIPE
=================================================
*/

export const stripe_transaction_data = {
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
    processor_hash: 'b81d1cea6ee1474dc8f6ff3cf5068f48',
    processor_method: 'stripe',
    sms: 'y',
    state: 'NM',
    state_international: '',
    subscription_plan: '',
    zip: '87121',
    stripe_account_id:  'acct_1PnJZxPIBRU4yQMf',
  }
  
  export const stripe_payment_token = 'tok_1PpuPCPIBRU4yQMfsNN6USON';
  
  export const stripe_token_response_success = {
      "id": "tok_1PpuPCPIBRU4yQMfsNN6USON",
      "object": "token",
      "card": {
          "id": "card_1PpuPCPIBRU4yQMfaGVyLKcr",
          "object": "card",
          "address_city": "Albuquerque",
          "address_country": "US",
          "address_line1": "110 2nd St SW Suite 501",
          "address_line1_check": "unchecked",
          "address_line2": "null",
          "address_state": "NM",
          "address_zip": "87102",
          "address_zip_check": "unchecked",
          "brand": "Visa",
          "country": "US",
          "cvc_check": "unchecked",
          "dynamic_last4": null,
          "exp_month": 12,
          "exp_year": 2028,
          "funding": "credit",
          "last4": "1111",
          "name": "The Donald",
          "networks": {
              "preferred": null
          },
          "tokenization_method": null,
          "wallet": null
      },
      "client_ip": "184.60.30.208",
      "created": 1724169334,
      "livemode": false,
      "type": "card",
      "used": false
  }
  
  export const stripe_token_response_error = {
    "error": {
        "message": "Invalid API Key provided: fake",
        "type": "invalid_request_error"
    }
  }
  
  export const stripe_authentication_key_response_success = {
    "request_number": 23,
    "auth_key": "pk_test_KW9spdmIczhzrrfeMrgBC41a",
    "stripe_account_id": "acct_1PnJZxPIBRU4yQMf",
    "status": "ok",
    "msg": "key found"
  }