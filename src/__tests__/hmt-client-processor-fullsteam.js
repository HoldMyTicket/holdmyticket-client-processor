import hmt_client_processor from '../hmt-client-processor';
import {
  successful_transaction_response,
  card_data,
  fullsteam_transaction_data,
  fullsteam_payment_token,
  fullsteam_authentication_key_response_success,
  fullsteam_token_response_success
} from '../test/test-data';

const hmt_client_processor_settings = {
  api_url : 'http://holdmyticket.loc/api/',
  env : 'dev',
  api_url_suffix : ''
}

let fresh_card_data;

let fresh_fullsteam_transaction_data;
let fresh_fullsteam_authentication_key_response_success;
let fresh_fullsteam_token_response_success;

describe('_submit_fullsteam', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_transaction_data = Object.assign({}, fullsteam_transaction_data);
    fresh_fullsteam_authentication_key_response_success = Object.assign({}, fullsteam_authentication_key_response_success);
    fresh_fullsteam_token_response_success = Object.assign({}, fullsteam_token_response_success);
    fresh_card_data = Object.assign({}, card_data);
  });

  test('submits the transaction if payment token already exists', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_submit_fullsteam_transaction');
    cc_processor._submit_fullsteam_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));

    const fullsteam_transaction_with_payment_token = Object.assign({}, fresh_fullsteam_transaction_data, {payment_token: fullsteam_payment_token})

    const cc_processor_response = await cc_processor._submit_fullsteam(fresh_card_data, fullsteam_transaction_with_payment_token);

    expect(cc_processor._submit_fullsteam_transaction).toHaveBeenCalledTimes(1);
    expect(cc_processor._submit_fullsteam_transaction).toHaveBeenCalledWith(fullsteam_transaction_with_payment_token);
    expect(cc_processor_response).toBe(successful_transaction_response);
    
    cc_processor._submit_fullsteam_transaction.mockRestore();
  });

  test('submits the transaction if payment token does NOT exist', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_fullsteam_auth_key');
    jest.spyOn(cc_processor, '_get_fullsteam_token');
    jest.spyOn(cc_processor, '_submit_fullsteam_transaction');
    cc_processor._get_fullsteam_auth_key.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_authentication_key_response_success));
    cc_processor._get_fullsteam_token.mockImplementationOnce((card, transaction, auth_key) => Promise.resolve(fresh_fullsteam_token_response_success));
    cc_processor._submit_fullsteam_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    
    const cc_processor_response = await cc_processor._submit_fullsteam(fresh_card_data, fresh_fullsteam_transaction_data);
    
    expect(cc_processor._get_fullsteam_auth_key).toHaveBeenCalledTimes(1);

    expect(cc_processor._get_fullsteam_token).toHaveBeenCalledTimes(1);
    expect(cc_processor._get_fullsteam_token).toHaveBeenCalledWith(fresh_card_data, fresh_fullsteam_transaction_data, fresh_fullsteam_authentication_key_response_success.authenticationKey);

    expect(cc_processor._submit_fullsteam_transaction).toHaveBeenCalledTimes(1);
    expect(cc_processor._submit_fullsteam_transaction).toHaveBeenCalledWith(fresh_fullsteam_transaction_data);
    expect(cc_processor_response).toBe(successful_transaction_response);
    
    cc_processor._get_fullsteam_auth_key.mockRestore();
    cc_processor._get_fullsteam_token.mockRestore();
    cc_processor._submit_fullsteam_transaction.mockRestore();
  });
})

describe('_get_fullsteam_auth_key', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_authentication_key_response_success = Object.assign({}, fullsteam_authentication_key_response_success);
  });

  test('returns fullsteam authentication key', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_authentication_key_response_success));

    const fullsteam_auth_key_response = await cc_processor._get_fullsteam_auth_key();

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/processors/get_authentication_key'
    });

    expect(fullsteam_auth_key_response).toBe(fresh_fullsteam_authentication_key_response_success);

    cc_processor._request.mockRestore();
  })
});

describe('_get_fullsteam_token', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_transaction_data = Object.assign({}, fullsteam_transaction_data);
    fresh_fullsteam_authentication_key_response_success = Object.assign({}, fullsteam_authentication_key_response_success);
    fresh_fullsteam_token_response_success = Object.assign({}, fullsteam_token_response_success);
    fresh_card_data = Object.assign({}, card_data);
  });

  test('returns token and makes request with correct data', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_token_response_success));

    const fullsteam_token_response = await cc_processor._get_fullsteam_token(fresh_card_data, fresh_fullsteam_transaction_data, fresh_fullsteam_authentication_key_response_success.authenticationKey);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'https://api-ext.fullsteampay.net/api/token/card/clearText/create',
      type: 'POST',
      cors: true,
      crossdomain: true,
      data: {
        "clearTextCardData": {
          "cardNumber": '4111111111111111',
          "cvv": fresh_card_data.payment_method.credit_card.verification_value,
          "expirationMonth": fresh_card_data.payment_method.credit_card.month,
          "expirationYear": fresh_card_data.payment_method.credit_card.year,
          "billingInformation": {
            "nameOnAccount": fresh_card_data.payment_method.credit_card.full_name,
            "firstName": fresh_fullsteam_transaction_data.f_name,
            "lastName": fresh_fullsteam_transaction_data.l_name,
            "address1": fresh_fullsteam_transaction_data.address1,
            "address2": null,
            "city": fresh_fullsteam_transaction_data.city,
            "state": fresh_fullsteam_transaction_data.state,
            "zip": fresh_fullsteam_transaction_data.zip,
            "country": 'US',
            "phone": fresh_fullsteam_transaction_data.phone,
            "email": fresh_fullsteam_transaction_data.email1,
          }
        },
        "cardEntryContext": 5,
        "performAccountVerification": true
      },
      json: true,
      withCredentials : false,
      auth_key: fresh_fullsteam_authentication_key_response_success.authenticationKey
    });

    expect(fullsteam_token_response).toBe(fresh_fullsteam_token_response_success);

    cc_processor._request.mockRestore();
  });
});

describe('_submit_fullsteam_transaction', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_transaction_data = Object.assign({}, fullsteam_transaction_data);
  });

  test('submits the transaction', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve(successful_transaction_response));

    const fullsteam_submit_transaction_response = await cc_processor._submit_fullsteam_transaction(fresh_fullsteam_transaction_data);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/submit',
      type: 'POST',
      data: fresh_fullsteam_transaction_data,
      form_encoded: true,
      withCredentials: true
    });

    expect(fullsteam_submit_transaction_response).toBe(successful_transaction_response);

    cc_processor._request.mockRestore();
  });
});

describe('_get_fullsteam_contry_code', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_transaction_data = Object.assign({}, fullsteam_transaction_data);
  });

  test('returns country code', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const fullsteam_country_code_response = cc_processor._get_fullsteam_contry_code(fresh_fullsteam_transaction_data);

    expect(fullsteam_country_code_response).toBe('US');
  });
});