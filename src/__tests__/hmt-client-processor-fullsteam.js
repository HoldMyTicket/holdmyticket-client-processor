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

describe('submit_transaction', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_transaction_data = JSON.parse(JSON.stringify(fullsteam_transaction_data));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
  });

  test('submits the transaction for fullsteam if transaction processor is fullsteam', (done) => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_submit_fullsteam');
    jest.spyOn(cc_processor, '_respond');
    cc_processor._submit_fullsteam.mockImplementationOnce((card, transaction, cb) => Promise.resolve(successful_transaction_response));
    cc_processor._respond.mockImplementationOnce((err, res, cb) => { cb(null, res); });

    cc_processor.submit_transaction(fresh_card_data, fresh_fullsteam_transaction_data, (err, response) => {
      expect(cc_processor._submit_fullsteam).toHaveBeenCalledTimes(1);
      expect(cc_processor._submit_fullsteam).toHaveBeenCalledWith(fresh_card_data, fresh_fullsteam_transaction_data, expect.any(Function));

      expect(cc_processor._respond).toHaveBeenCalledTimes(1);
      expect(cc_processor._respond).toHaveBeenCalledWith(false, successful_transaction_response, expect.any(Function));

      expect(response).toEqual(successful_transaction_response);

      cc_processor._submit_fullsteam.mockRestore();
      cc_processor._respond.mockRestore();

      done();
    });
  });

  test('adds an internal error if transaction does NOT have processor method', (done) => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_add_internal_error');
    jest.spyOn(cc_processor, '_log_bad_trans');
    jest.spyOn(cc_processor, '_respond');
    cc_processor._respond.mockImplementationOnce((err, res, cb) => { cb(null, res); });
    cc_processor._log_bad_trans.mockImplementationOnce(() => undefined);

    delete fresh_fullsteam_transaction_data.processor_method;
    
    cc_processor.submit_transaction(fresh_card_data, {}, (err, response) => {
      expect(cc_processor._add_internal_error).toHaveBeenCalledTimes(1);
      expect(cc_processor._add_internal_error).toHaveBeenCalledWith(expect.any(String));

      expect(cc_processor.errors_internal).toHaveLength(1);

      cc_processor._add_internal_error.mockRestore();
      cc_processor._respond.mockRestore();

      done();
    });
  });

  test('adds an internal error if transaction does NOT have processor method', (done) => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_add_internal_error');
    jest.spyOn(cc_processor, '_log_bad_trans');
    jest.spyOn(cc_processor, '_respond');
    cc_processor._respond.mockImplementationOnce((err, res, cb) => { cb(null, res); });
    cc_processor._log_bad_trans.mockImplementationOnce(() => undefined);

    delete fresh_fullsteam_transaction_data.processor_method;
    
    cc_processor.submit_transaction(fresh_card_data, {test: 'test'}, (err, response) => {
      expect(cc_processor._log_bad_trans).toHaveBeenCalledTimes(1);
      expect(cc_processor._log_bad_trans).toHaveBeenCalledWith({test: 'test'})

      cc_processor._add_internal_error.mockRestore();
      cc_processor._respond.mockRestore();

      done();
    });
  });
});

describe('_submit_fullsteam', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_transaction_data = JSON.parse(JSON.stringify(fullsteam_transaction_data));
    fresh_fullsteam_authentication_key_response_success = JSON.parse(JSON.stringify(fullsteam_authentication_key_response_success));
    fresh_fullsteam_token_response_success = JSON.parse(JSON.stringify(fullsteam_token_response_success));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
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

  test('generates token and submits the transaction if payment token does NOT exist', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_fullsteam_auth_key');
    jest.spyOn(cc_processor, '_get_fullsteam_token');
    jest.spyOn(cc_processor, '_submit_fullsteam_transaction');
    jest.spyOn(cc_processor, '_save_card_to_webuser');
    cc_processor._get_fullsteam_auth_key.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_authentication_key_response_success));
    cc_processor._get_fullsteam_token.mockImplementationOnce((card, transaction, auth_key) => Promise.resolve(fresh_fullsteam_token_response_success));
    cc_processor._submit_fullsteam_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    cc_processor._save_card_to_webuser.mockImplementationOnce((args) => Promise.resolve(undefined));
    
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

  test('saves card for spreedly if transaction has cc_retain = y', async () => {
    const client_processor_settings_with_spreedly_env_key = Object.assign({}, hmt_client_processor, { spreedly_environment_key: '12345' });
    const cc_processor = new hmt_client_processor(client_processor_settings_with_spreedly_env_key);

    jest.spyOn(cc_processor, '_get_fullsteam_auth_key');
    jest.spyOn(cc_processor, '_get_fullsteam_token');
    jest.spyOn(cc_processor, '_submit_fullsteam_transaction');
    jest.spyOn(cc_processor, '_save_card_to_webuser');
    jest.spyOn(cc_processor, '_get_spreedly_env_key');
    jest.spyOn(cc_processor, '_save_card');
    cc_processor._get_fullsteam_auth_key.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_authentication_key_response_success));
    cc_processor._get_fullsteam_token.mockImplementationOnce((card, transaction, auth_key) => Promise.resolve(fresh_fullsteam_token_response_success));
    cc_processor._submit_fullsteam_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    cc_processor._save_card_to_webuser.mockImplementationOnce((args) => Promise.resolve(undefined));
    cc_processor._save_card.mockImplementationOnce((args) => Promise.resolve(undefined));

    fresh_fullsteam_transaction_data.cc_retain = 'y';
    
    const cc_processor_response = await cc_processor._submit_fullsteam(fresh_card_data, fresh_fullsteam_transaction_data);

    expect(cc_processor._get_spreedly_env_key).toHaveBeenCalledTimes(1);
    expect(cc_processor._get_spreedly_env_key).toHaveReturnedWith('12345');

    expect(cc_processor._save_card).toHaveBeenCalledTimes(1);
    expect(cc_processor._save_card).toHaveBeenCalledWith(fresh_card_data, fresh_fullsteam_transaction_data, 'spreedly');
    
    cc_processor._get_fullsteam_auth_key.mockRestore();
    cc_processor._get_fullsteam_token.mockRestore();
    cc_processor._submit_fullsteam_transaction.mockRestore();
    cc_processor._save_card_to_webuser.mockRestore();
    cc_processor._save_card.mockRestore();
    cc_processor._get_spreedly_env_key.mockRestore();
  })
})

describe('_get_fullsteam_auth_key', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_authentication_key_response_success = JSON.parse(JSON.stringify(fullsteam_authentication_key_response_success));
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
    fresh_fullsteam_transaction_data = JSON.parse(JSON.stringify(fullsteam_transaction_data));
    fresh_fullsteam_authentication_key_response_success = JSON.parse(JSON.stringify(fullsteam_authentication_key_response_success));
    fresh_fullsteam_token_response_success = JSON.parse(JSON.stringify(fullsteam_token_response_success));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
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

  test('returns false and adds processing error if missing card', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    jest.spyOn(cc_processor, '_add_processing_error');
    cc_processor._request.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_token_response_success));

    const fullsteam_token_response = await cc_processor._get_fullsteam_token({}, fresh_fullsteam_transaction_data, fresh_fullsteam_authentication_key_response_success.authenticationKey);

    expect(cc_processor._add_processing_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_processing_error).toHaveBeenCalledWith(expect.any(String));

    expect(cc_processor.errors_processing).toHaveLength(1);

    expect(fullsteam_token_response).toBe(false);

    cc_processor._request.mockRestore();
    cc_processor._add_processing_error.mockRestore();
  });

  test('returns false and adds processing error if missing card.payment_method', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    jest.spyOn(cc_processor, '_add_processing_error');
    cc_processor._request.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_token_response_success));
    
    delete fresh_card_data.payment_method;

    const fullsteam_token_response = await cc_processor._get_fullsteam_token(fresh_card_data, fresh_fullsteam_transaction_data, fresh_fullsteam_authentication_key_response_success.authenticationKey);

    expect(cc_processor._add_processing_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_processing_error).toHaveBeenCalledWith(expect.any(String));

    expect(cc_processor.errors_processing).toHaveLength(1);

    expect(fullsteam_token_response).toBe(false);

    cc_processor._request.mockRestore();
    cc_processor._add_processing_error.mockRestore();
  });

  test('returns false and adds processing error if missing card.payment_method.credit_card', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    jest.spyOn(cc_processor, '_add_processing_error');
    cc_processor._request.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_token_response_success));
    
    delete fresh_card_data.payment_method.credit_card;

    const fullsteam_token_response = await cc_processor._get_fullsteam_token(fresh_card_data, fresh_fullsteam_transaction_data, fresh_fullsteam_authentication_key_response_success.authenticationKey);

    expect(cc_processor._add_processing_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_processing_error).toHaveBeenCalledWith(expect.any(String));

    expect(cc_processor.errors_processing).toHaveLength(1);

    expect(fullsteam_token_response).toBe(false);

    cc_processor._request.mockRestore();
    cc_processor._add_processing_error.mockRestore();
  });
  
  ['number', 'month', 'year', 'full_name', 'verification_value'].forEach(key => {
    test(`returns false and adds processing error if missing card.payment_method.credit_card.${key}`, async () => {
      const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

      jest.spyOn(cc_processor, '_request');
      jest.spyOn(cc_processor, '_add_processing_error');
      cc_processor._request.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_token_response_success));
      
      delete fresh_card_data.payment_method.credit_card[key];

      const fullsteam_token_response = await cc_processor._get_fullsteam_token(fresh_card_data, fresh_fullsteam_transaction_data, fresh_fullsteam_authentication_key_response_success.authenticationKey);

      expect(cc_processor._add_processing_error).toHaveBeenCalledTimes(1);
      expect(cc_processor._add_processing_error).toHaveBeenCalledWith(expect.any(String));

      expect(cc_processor.errors_processing).toHaveLength(1);

      expect(fullsteam_token_response).toBe(false);

      cc_processor._request.mockRestore();
      cc_processor._add_processing_error.mockRestore();
    });
  });

  test('removes the state property from clearTextCardData billing information if country code is NOT 2 (2 = US)', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_token_response_success));

    fresh_fullsteam_transaction_data.country_id = '1';

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
  })
});

describe('_submit_fullsteam_transaction', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_transaction_data = JSON.parse(JSON.stringify(fullsteam_transaction_data));
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

  test('updates transaction payments array with payment_token if transaction object has payments array', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    jest.spyOn(cc_processor, '_update_payments_token');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve(successful_transaction_response));

    const payments = [{ type: 'credit', amount: 10 }, { type: 'cash', amount: 5 }];
    const payment_token = '111222333';

    const expected_payments = [{ type: 'credit', amount: 10, payment_token: payment_token }, { type: 'cash', amount: 5 }];
    const expected_fullsteam_transaction_data = Object.assign({}, fresh_fullsteam_transaction_data, { payment_token, payments: expected_payments });
    
    fresh_fullsteam_transaction_data.payments = payments;
    fresh_fullsteam_transaction_data.payment_token = payment_token;

    const fullsteam_submit_transaction_response = await cc_processor._submit_fullsteam_transaction(fresh_fullsteam_transaction_data);

    expect(cc_processor._update_payments_token).toHaveBeenCalledTimes(1);
    expect(cc_processor._update_payments_token).toHaveBeenCalledWith(expected_payments, payment_token);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/submit',
      type: 'POST',
      data: expected_fullsteam_transaction_data,
      form_encoded: true,
      withCredentials: true
    });

    expect(fullsteam_submit_transaction_response).toBe(successful_transaction_response);

    cc_processor._update_payments_token.mockRestore();
    cc_processor._request.mockRestore();
  });
});

describe('_get_fullsteam_contry_code', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_fullsteam_transaction_data = JSON.parse(JSON.stringify(fullsteam_transaction_data));
  });

  test('returns country code', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const fullsteam_country_code_response = cc_processor._get_fullsteam_contry_code(fresh_fullsteam_transaction_data);

    expect(fullsteam_country_code_response).toBe('US');
  });

  test('returns "US" country code if transaction does not have country_id', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    delete fresh_fullsteam_transaction_data.country_id;
    const fullsteam_country_code_response = cc_processor._get_fullsteam_contry_code(fresh_fullsteam_transaction_data);

    expect(fullsteam_country_code_response).toBe('US');
  });
});

describe('fullsteam_url', () => {
  const environments = ['local', 'dev', 'staging', 'production'];

  environments.forEach(environment => {
    test(`returns the correct url for ${environment} environment`, () => {
      const updated_hmt_client_processor_settings = Object.assign({}, hmt_client_processor_settings, { env: environment });
      
      const cc_processor = new hmt_client_processor(updated_hmt_client_processor_settings);

      const fullsteam_url_response = cc_processor.fullsteam_url();

      if (environment === 'production') expect(fullsteam_url_response).toBe('https://api.fullsteampay.net/');
      else expect(fullsteam_url_response).toBe('https://api-ext.fullsteampay.net/');
    });
  });
});