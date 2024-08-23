import hmt_client_processor from '../hmt-client-processor';
import {
  successful_transaction_response,
  successful_create_charge_worker_response,
  card_data,
} from '../test/test-data';

import {
  stripe_transaction_data,
  stripe_payment_token,
  stripe_token_response_success,
  stripe_token_response_error,
  stripe_authentication_key_response_success,
} from '../test/test-data-stripe';

const hmt_client_processor_settings = {
  api_url : 'http://holdmyticket.loc/api/',
  env : 'dev',
  api_url_suffix : ''
}

let fresh_card_data;

let fresh_stripe_transaction_data;
let fresh_stripe_token_response_error;
let fresh_stripe_authentication_key_response_success;

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(stripe_token_response_success), // or any other expected response
  })
);

global.fetch.mockImplementation(() =>
  Promise.resolve({
      json: () => Promise.resolve(stripe_token_response_success),
  })
);

describe('_get_auth_key', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_stripe_authentication_key_response_success = JSON.parse(JSON.stringify(stripe_authentication_key_response_success));
  });

  test('returns stripe authentication key', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce(() => Promise.resolve(fresh_stripe_authentication_key_response_success));

    const stripe_auth_key_response = await cc_processor._get_auth_key();

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/processors/get_authentication_key?v=0.0.83',
      withCredentials: true,
    })

    expect(stripe_auth_key_response).toBe(fresh_stripe_authentication_key_response_success);

    cc_processor._request.mockRestore();
  })
});

describe('submit_transaction', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_stripe_transaction_data = JSON.parse(JSON.stringify(stripe_transaction_data));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
  });

  test('submits the transaction for stripe if transaction processor is stripe', (done) => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_submit_stripe');
    jest.spyOn(cc_processor, '_respond');
    cc_processor._submit_stripe.mockImplementationOnce((card, transaction, cb) => Promise.resolve(successful_transaction_response));
    cc_processor._respond.mockImplementationOnce((err, res, cb) => { cb(null, res); });

    cc_processor.submit_transaction(fresh_card_data, fresh_stripe_transaction_data, (err, response) => {
      expect(cc_processor._submit_stripe).toHaveBeenCalledTimes(1);
      expect(cc_processor._submit_stripe).toHaveBeenCalledWith(fresh_card_data, fresh_stripe_transaction_data, expect.any(Function));

      expect(cc_processor._respond).toHaveBeenCalledTimes(1);
      expect(cc_processor._respond).toHaveBeenCalledWith(false, successful_transaction_response, expect.any(Function));

      expect(response).toEqual(successful_transaction_response);

      cc_processor._submit_stripe.mockRestore();
      cc_processor._respond.mockRestore();

      done();
    });
  });
});

describe('_submit_stripe', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_stripe_transaction_data = JSON.parse(JSON.stringify(stripe_transaction_data));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
  });

  test('submits the transaction if payment token already exists', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    
    jest.spyOn(cc_processor, '_submit_stripe_transaction');
    cc_processor._submit_stripe_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    
    const stripe_transaction_with_payment_token = Object.assign({}, fresh_stripe_transaction_data, {
      payment_token: stripe_payment_token, 
      stripe_account_id: 'acct_1PnJZxPIBRU4yQMf'
    });
    
    const cc_processor_response = await cc_processor._submit_stripe(fresh_card_data, stripe_transaction_with_payment_token);

    expect(cc_processor._submit_stripe_transaction).toHaveBeenCalledTimes(1);
    expect(cc_processor._submit_stripe_transaction).toHaveBeenCalledWith(stripe_transaction_with_payment_token);
    expect(cc_processor_response).toBe(successful_transaction_response);
    
    cc_processor._submit_stripe_transaction.mockRestore();
  });

  test('generates token and submits the transaction if payment token does NOT exist', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_stripe_token');
    jest.spyOn(cc_processor, '_submit_stripe_transaction');
    jest.spyOn(cc_processor, '_get_auth_key');
    cc_processor._get_stripe_token.mockImplementationOnce((card, stripe_environment_key, cb) => Promise.resolve(stripe_token_response_success));
    cc_processor._submit_stripe_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    cc_processor._get_auth_key.mockImplementationOnce((transaction) => Promise.resolve(stripe_authentication_key_response_success));

    const cc_processor_response = await cc_processor._submit_stripe(fresh_card_data, fresh_stripe_transaction_data);
    
    expect(cc_processor._get_stripe_token).toHaveBeenCalledTimes(1);
    expect(cc_processor._get_stripe_token).toHaveBeenCalledWith(fresh_card_data, fresh_stripe_transaction_data, stripe_authentication_key_response_success.auth_key, fresh_stripe_transaction_data.stripe_account_id);

    expect(cc_processor._submit_stripe_transaction).toHaveBeenCalledTimes(1);
    expect(cc_processor._submit_stripe_transaction).toHaveBeenCalledWith(fresh_stripe_transaction_data);
    expect(cc_processor_response).toBe(successful_transaction_response);
    
    cc_processor._get_stripe_token.mockRestore();
    cc_processor._submit_stripe_transaction.mockRestore();
  });

  test.skip('saves card to webuser if transaction response has ticket key', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_stripe_token');
    jest.spyOn(cc_processor, '_submit_stripe_transaction');
    jest.spyOn(cc_processor, '_save_card_to_webuser');
    cc_processor._get_stripe_token.mockImplementationOnce((card, stripe_environment_key, cb) => Promise.resolve(stripe_token_response_success));
    cc_processor._submit_stripe_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    cc_processor._save_card_to_webuser.mockImplementationOnce((args) => Promise.resolve(undefined));
    
    const cc_processor_response = await cc_processor._submit_stripe(fresh_card_data, fresh_stripe_transaction_data);

    expect(cc_processor._save_card_to_webuser).toHaveBeenCalledTimes(1);
    expect(cc_processor._save_card_to_webuser).toHaveBeenCalledWith({ticket_key: successful_transaction_response.ticket_key});

    cc_processor._get_stripe_token.mockRestore();
    cc_processor._submit_stripe_transaction.mockRestore();
    cc_processor._save_card_to_webuser.mockRestore();
  });

  test.skip('saves card for stripe if transaction has cc_retain = y', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_stripe_token');
    jest.spyOn(cc_processor, '_submit_stripe_transaction');
    jest.spyOn(cc_processor, '_save_card_to_webuser');
    jest.spyOn(cc_processor, '_save_card');
    cc_processor._get_stripe_token.mockImplementationOnce((card, stripe_environment_key, cb) => Promise.resolve(stripe_token_response_success));
    cc_processor._submit_stripe_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    cc_processor._save_card_to_webuser.mockImplementationOnce((args) => Promise.resolve(undefined));
    cc_processor._save_card.mockImplementationOnce((args) => Promise.resolve(undefined));

    fresh_stripe_transaction_data.cc_retain = 'y';
    
    const cc_processor_response = await cc_processor._submit_stripe(fresh_card_data, fresh_stripe_transaction_data);

    expect(cc_processor._save_card).toHaveBeenCalledTimes(1);
    expect(cc_processor._save_card).toHaveBeenCalledWith(fresh_card_data, fresh_stripe_transaction_data, 'fullsteam');

    cc_processor._get_stripe_token.mockRestore();
    cc_processor._submit_stripe_transaction.mockRestore();
    cc_processor._save_card_to_webuser.mockRestore();
    cc_processor._save_card.mockRestore();
  })

  test('returns false if token response is a falsy value', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_stripe_token');
    jest.spyOn(cc_processor, '_add_internal_error');
    jest.spyOn(cc_processor, '_get_auth_key');

    cc_processor._get_stripe_token.mockImplementationOnce((card, stripe_environment_key, auth_key, account_id) => Promise.resolve(false));
    cc_processor._add_internal_error.mockImplementationOnce((err) => false);
    cc_processor._get_auth_key.mockImplementationOnce(() => Promise.resolve(stripe_authentication_key_response_success));


    const cc_processor_response = await cc_processor._submit_stripe(fresh_card_data, fresh_stripe_transaction_data);
    
    expect(cc_processor._add_internal_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_internal_error).toHaveBeenCalledWith(expect.any(String));

    expect(cc_processor_response).toBe(false);

    cc_processor._get_stripe_token.mockRestore();
    cc_processor._add_internal_error.mockRestore();
  });

});

describe('_get_stripe_token', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_stripe_transaction_data = JSON.parse(JSON.stringify(stripe_transaction_data));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
    fresh_stripe_token_response_error = JSON.parse(JSON.stringify(stripe_token_response_error));
  });

  test('returns token and makes request with correct data', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(global, 'fetch');

    const auth_key = await cc_processor._get_auth_key();
    const stripe_token_response = await cc_processor._get_stripe_token(fresh_card_data, fresh_stripe_transaction_data, auth_key, fresh_stripe_transaction_data.stripe_account_id);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.stripe.com/v1/tokens', // URL
      {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${auth_key}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Stripe-Account': fresh_stripe_transaction_data.stripe_account_id,
          },
          body: expect.any(String), // Since the body is URLSearchParams, it will be a string
      }
    );

    expect(stripe_token_response).toBe(stripe_token_response_success);

    global.fetch.mockRestore();
  })

  test('processing errors are added if token response returned with errors', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(global, 'fetch');
    jest.spyOn(cc_processor, '_add_processing_error');
    cc_processor._add_processing_error.mockImplementationOnce((err) => false);

    // Mock fetch to return an error response
    jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        'ok': false,
        'status': 400,
        json: () => Promise.resolve(stripe_token_response_error), // Mocking an error response
      })
    );

    const auth_key = '82';
    const stripe_token_response = await cc_processor._get_stripe_token(fresh_card_data, fresh_stripe_transaction_data, auth_key, fresh_stripe_transaction_data.stripe_account_id);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.stripe.com/v1/tokens', // URL
      {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${auth_key}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Stripe-Account': fresh_stripe_transaction_data.stripe_account_id,
          },
          body: expect.any(String), // Since the body is URLSearchParams, it will be a string
      }
    );

    expect(cc_processor._add_processing_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_processing_error).toHaveBeenCalledWith(stripe_token_response_error.error.message);

    expect(stripe_token_response).toBe(stripe_token_response_error);

    global.fetch.mockRestore();
  })
});

describe('_submit_stripe_transaction', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_stripe_transaction_data = JSON.parse(JSON.stringify(stripe_transaction_data));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
    fresh_stripe_token_response_error = JSON.parse(JSON.stringify(stripe_token_response_error));
  });

  test('submits the transaction', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve(successful_transaction_response));

    const stripe_submit_transaction_response = await cc_processor._submit_stripe_transaction(fresh_stripe_transaction_data);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/submit',
      type: 'POST',
      data: fresh_stripe_transaction_data,
      form_encoded: true,
      withCredentials: true
    });

    expect(stripe_submit_transaction_response).toBe(successful_transaction_response);

    cc_processor._request.mockRestore();
  });

  test('submits the transaction using charge worker endpoint when charge_workers setting is enabled', async () => {
    const copied_hmt_client_processor_settings = JSON.parse(JSON.stringify(hmt_client_processor_settings));
    copied_hmt_client_processor_settings.charge_workers = true;
    const cc_processor = new hmt_client_processor(copied_hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    jest.spyOn(cc_processor, '_check_charge_worker');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve(successful_create_charge_worker_response));
    cc_processor._check_charge_worker.mockImplementationOnce(() => undefined);

    const stripe_submit_transaction_response = await cc_processor._submit_stripe_transaction(fresh_stripe_transaction_data);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/create_charge_worker',
      type: 'POST',
      data: fresh_stripe_transaction_data,
      form_encoded: true,
      withCredentials: true
    });

    expect(cc_processor._check_charge_worker).toHaveBeenCalledTimes(1);
    expect(cc_processor._check_charge_worker).toHaveBeenCalledWith(successful_create_charge_worker_response.worker_reference);

    cc_processor._request.mockRestore();
    cc_processor._check_charge_worker.mockRestore();
  });

  test('returns false and adds a processing error if the create_charge_worker response has a error status', async () => {
    const copied_hmt_client_processor_settings = JSON.parse(JSON.stringify(hmt_client_processor_settings));
    copied_hmt_client_processor_settings.charge_workers = true;
    const cc_processor = new hmt_client_processor(copied_hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    jest.spyOn(cc_processor, '_add_processing_error');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve({ status: 'error' }));

    const stripe_submit_transaction_response = await cc_processor._submit_stripe_transaction(fresh_stripe_transaction_data);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/create_charge_worker',
      type: 'POST',
      data: fresh_stripe_transaction_data,
      form_encoded: true,
      withCredentials: true
    });

    expect(cc_processor._add_processing_error).toHaveBeenCalledTimes(1);
    
    expect(stripe_submit_transaction_response).toBe(false);

    cc_processor._request.mockRestore();
    cc_processor._add_processing_error.mockRestore();
  });

  test('updates transaction payments array with payment_token if transaction object has payments array', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    jest.spyOn(cc_processor, '_update_payments_token');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve(successful_transaction_response));

    const payments = [{ type: 'credit', amount: 10 }, { type: 'cash', amount: 5 }];
    const payment_token = '111222333';

    const expected_payments = [{ type: 'credit', amount: 10, payment_token: payment_token }, { type: 'cash', amount: 5 }];
    const expected_stripe_transaction_data = Object.assign({}, fresh_stripe_transaction_data, { payment_token, payments: expected_payments });
    
    fresh_stripe_transaction_data.payments = payments;
    fresh_stripe_transaction_data.payment_token = payment_token;

    const stripe_submit_transaction_response = await cc_processor._submit_stripe_transaction(fresh_stripe_transaction_data);

    expect(cc_processor._update_payments_token).toHaveBeenCalledTimes(1);
    expect(cc_processor._update_payments_token).toHaveBeenCalledWith(expected_payments, payment_token);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/submit',
      type: 'POST',
      data: expected_stripe_transaction_data,
      form_encoded: true,
      withCredentials: true
    });

    expect(stripe_submit_transaction_response).toBe(successful_transaction_response);

    cc_processor._update_payments_token.mockRestore();
    cc_processor._request.mockRestore();
  });
});

describe('stripe_url', () => {
  test('returns the stripe url with the stripe environment key set to the one that was passed in as an argument', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const stripe_url_response = cc_processor.stripe_url();

    expect(stripe_url_response).toBe(`https://api.stripe.com/v1/`)
  });
});