import hmt_client_processor from '../hmt-client-processor';
import {
  successful_transaction_response,
  successful_create_charge_worker_response,
  card_data,
  spreedly_transaction_data,
  spreedly_payment_token,
  spreedly_token_response_success,
  spreedly_token_response_error,
} from '../test/test-data';

const hmt_client_processor_settings = {
  api_url : 'http://holdmyticket.loc/api/',
  env : 'dev',
  api_url_suffix : ''
}

let fresh_card_data;

let fresh_spreedly_transaction_data;
let fresh_spreedly_token_response_error;

describe('submit_transaction', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_spreedly_transaction_data = JSON.parse(JSON.stringify(spreedly_transaction_data));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
  });

  test('submits the transaction for spreedly if transaction processor is spreedly', (done) => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_submit_spreedly');
    jest.spyOn(cc_processor, '_respond');
    cc_processor._submit_spreedly.mockImplementationOnce((card, transaction, cb) => Promise.resolve(successful_transaction_response));
    cc_processor._respond.mockImplementationOnce((err, res, cb) => { cb(null, res); });

    cc_processor.submit_transaction(fresh_card_data, fresh_spreedly_transaction_data, (err, response) => {
      expect(cc_processor._submit_spreedly).toHaveBeenCalledTimes(1);
      expect(cc_processor._submit_spreedly).toHaveBeenCalledWith(fresh_card_data, fresh_spreedly_transaction_data, expect.any(Function));

      expect(cc_processor._respond).toHaveBeenCalledTimes(1);
      expect(cc_processor._respond).toHaveBeenCalledWith(false, successful_transaction_response, expect.any(Function));

      expect(response).toEqual(successful_transaction_response);

      cc_processor._submit_spreedly.mockRestore();
      cc_processor._respond.mockRestore();

      done();
    });
  });
});

describe('_submit_spreedly', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_spreedly_transaction_data = JSON.parse(JSON.stringify(spreedly_transaction_data));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
  });

  test('submits the transaction if payment token already exists', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_submit_spreedly_transaction');
    cc_processor._submit_spreedly_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));

    const spreedly_transaction_with_payment_token = Object.assign({}, fresh_spreedly_transaction_data, {payment_token: spreedly_payment_token})

    const cc_processor_response = await cc_processor._submit_spreedly(fresh_card_data, spreedly_transaction_with_payment_token);

    expect(cc_processor._submit_spreedly_transaction).toHaveBeenCalledTimes(1);
    expect(cc_processor._submit_spreedly_transaction).toHaveBeenCalledWith(spreedly_transaction_with_payment_token);
    expect(cc_processor_response).toBe(successful_transaction_response);
    
    cc_processor._submit_spreedly_transaction.mockRestore();
  });

  test('generates token and submits the transaction if payment token does NOT exist', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_spreedly_token');
    jest.spyOn(cc_processor, '_submit_spreedly_transaction');
    cc_processor._get_spreedly_token.mockImplementationOnce((card, spreedly_environment_key, cb) => Promise.resolve(spreedly_token_response_success));
    cc_processor._submit_spreedly_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_card_data, fresh_spreedly_transaction_data);
    
    expect(cc_processor._get_spreedly_token).toHaveBeenCalledTimes(1);
    expect(cc_processor._get_spreedly_token).toHaveBeenCalledWith(fresh_card_data, fresh_spreedly_transaction_data.spreedly_environment_key);

    expect(cc_processor._submit_spreedly_transaction).toHaveBeenCalledTimes(1);
    expect(cc_processor._submit_spreedly_transaction).toHaveBeenCalledWith(fresh_spreedly_transaction_data);
    expect(cc_processor_response).toBe(successful_transaction_response);
    
    cc_processor._get_spreedly_token.mockRestore();
    cc_processor._submit_spreedly_transaction.mockRestore();
  });

  test('saves card to webuser if transaction response has ticket key', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_spreedly_token');
    jest.spyOn(cc_processor, '_submit_spreedly_transaction');
    jest.spyOn(cc_processor, '_save_card_to_webuser');
    cc_processor._get_spreedly_token.mockImplementationOnce((card, spreedly_environment_key, cb) => Promise.resolve(spreedly_token_response_success));
    cc_processor._submit_spreedly_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    cc_processor._save_card_to_webuser.mockImplementationOnce((args) => Promise.resolve(undefined));
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_card_data, fresh_spreedly_transaction_data);

    expect(cc_processor._save_card_to_webuser).toHaveBeenCalledTimes(1);
    expect(cc_processor._save_card_to_webuser).toHaveBeenCalledWith({ticket_key: successful_transaction_response.ticket_key});

    cc_processor._get_spreedly_token.mockRestore();
    cc_processor._submit_spreedly_transaction.mockRestore();
    cc_processor._save_card_to_webuser.mockRestore();
  });

  test('saves card for fullsteam if transaction has cc_retain = y', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_spreedly_token');
    jest.spyOn(cc_processor, '_submit_spreedly_transaction');
    jest.spyOn(cc_processor, '_save_card_to_webuser');
    jest.spyOn(cc_processor, '_save_card');
    cc_processor._get_spreedly_token.mockImplementationOnce((card, spreedly_environment_key, cb) => Promise.resolve(spreedly_token_response_success));
    cc_processor._submit_spreedly_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    cc_processor._save_card_to_webuser.mockImplementationOnce((args) => Promise.resolve(undefined));
    cc_processor._save_card.mockImplementationOnce((args) => Promise.resolve(undefined));

    fresh_spreedly_transaction_data.cc_retain = 'y';
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_card_data, fresh_spreedly_transaction_data);

    expect(cc_processor._save_card).toHaveBeenCalledTimes(1);
    expect(cc_processor._save_card).toHaveBeenCalledWith(fresh_card_data, fresh_spreedly_transaction_data, 'fullsteam');

    cc_processor._get_spreedly_token.mockRestore();
    cc_processor._submit_spreedly_transaction.mockRestore();
    cc_processor._save_card_to_webuser.mockRestore();
    cc_processor._save_card.mockRestore();
  })

  test('returns false if token response is a falsy value', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_spreedly_token');
    jest.spyOn(cc_processor, '_add_internal_error');
    cc_processor._get_spreedly_token.mockImplementationOnce((card, spreedly_environment_key, cb) => Promise.resolve(false));
    cc_processor._add_internal_error.mockImplementationOnce((err) => false);
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_card_data, fresh_spreedly_transaction_data);
    
    expect(cc_processor._add_internal_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_internal_error).toHaveBeenCalledWith(expect.any(String));

    expect(cc_processor_response).toBe(false);

    cc_processor._get_spreedly_token.mockRestore();
    cc_processor._add_internal_error.mockRestore();
  });

  test('returns false if token response does not have transaction property', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_spreedly_token');
    jest.spyOn(cc_processor, '_add_internal_error');
    cc_processor._get_spreedly_token.mockImplementationOnce((card, spreedly_environment_key, cb) => {
      Promise.resolve({});
    });
    cc_processor._add_internal_error.mockImplementationOnce((err) => false);
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_card_data, fresh_spreedly_transaction_data);
    
    expect(cc_processor._add_internal_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_internal_error).toHaveBeenCalledWith(expect.any(String));

    expect(cc_processor_response).toBe(false);

    cc_processor._get_spreedly_token.mockRestore();
    cc_processor._add_internal_error.mockRestore();
  });

  test('return false if token response does not have payment_method property', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_spreedly_token');
    jest.spyOn(cc_processor, '_add_internal_error');
    cc_processor._get_spreedly_token.mockImplementationOnce((card, spreedly_environment_key, cb) => {
      Promise.resolve({ transaction: {} });
    });
    cc_processor._add_internal_error.mockImplementationOnce((err) => false);
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_card_data, fresh_spreedly_transaction_data);
    
    expect(cc_processor._add_internal_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_internal_error).toHaveBeenCalledWith(expect.any(String));

    expect(cc_processor_response).toBe(false);

    cc_processor._get_spreedly_token.mockRestore();
    cc_processor._add_internal_error.mockRestore();
  });

  test('return false if token response does not have token property', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_spreedly_token');
    jest.spyOn(cc_processor, '_add_internal_error');
    cc_processor._get_spreedly_token.mockImplementationOnce((card, spreedly_environment_key, cb) => {
      Promise.resolve({ transaction: { payment_method: {} } });
    });
    cc_processor._add_internal_error.mockImplementationOnce((err) => false);
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_card_data, fresh_spreedly_transaction_data);
    
    expect(cc_processor._add_internal_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_internal_error).toHaveBeenCalledWith(expect.any(String));

    expect(cc_processor_response).toBe(false);

    cc_processor._get_spreedly_token.mockRestore();
    cc_processor._add_internal_error.mockRestore();
  });
});

describe('_get_spreedly_token', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_spreedly_transaction_data = JSON.parse(JSON.stringify(spreedly_transaction_data));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
    fresh_spreedly_token_response_error = JSON.parse(JSON.stringify(spreedly_token_response_error));
  });

  test('returns token and makes request with correct data', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve(spreedly_token_response_success));

    const spreedly_token_response = await cc_processor._get_spreedly_token(fresh_card_data, fresh_spreedly_transaction_data.spreedly_environment_key);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: `https://core.spreedly.com/v1/payment_methods.json?environment_key=${fresh_spreedly_transaction_data.spreedly_environment_key}`,
      type: 'POST',
      withCredentials: false,
      json: true,
      data: fresh_card_data
    })

    expect(spreedly_token_response).toBe(spreedly_token_response_success);

    cc_processor._request.mockRestore();
  })

  test('processing errors are added if token response returned with errors', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    jest.spyOn(cc_processor, '_add_processing_error');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve(fresh_spreedly_token_response_error));
    cc_processor._add_processing_error.mockImplementationOnce((err) => false);

    const spreedly_token_response = await cc_processor._get_spreedly_token(fresh_card_data, fresh_spreedly_transaction_data.spreedly_environment_key);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: `https://core.spreedly.com/v1/payment_methods.json?environment_key=${fresh_spreedly_transaction_data.spreedly_environment_key}`,
      type: 'POST',
      withCredentials: false,
      json: true,
      data: fresh_card_data
    })

    expect(cc_processor._add_processing_error).toHaveBeenCalledTimes(1);
    expect(cc_processor._add_processing_error).toHaveBeenCalledWith(fresh_spreedly_token_response_error.errors[0].message);

    expect(spreedly_token_response).toBe(fresh_spreedly_token_response_error);

    cc_processor._request.mockRestore();
  })
});

describe('_submit_spreedly_transaction', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_spreedly_transaction_data = JSON.parse(JSON.stringify(spreedly_transaction_data));
    fresh_card_data = JSON.parse(JSON.stringify(card_data));
    fresh_spreedly_token_response_error = JSON.parse(JSON.stringify(spreedly_token_response_error));
  });

  test('submits the transaction', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve(successful_transaction_response));

    const spreedly_submit_transaction_response = await cc_processor._submit_spreedly_transaction(fresh_spreedly_transaction_data);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/submit',
      type: 'POST',
      data: fresh_spreedly_transaction_data,
      form_encoded: true,
      withCredentials: true
    });

    expect(spreedly_submit_transaction_response).toBe(successful_transaction_response);

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

    const spreedly_submit_transaction_response = await cc_processor._submit_spreedly_transaction(fresh_spreedly_transaction_data);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/create_charge_worker',
      type: 'POST',
      data: fresh_spreedly_transaction_data,
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

    const spreedly_submit_transaction_response = await cc_processor._submit_spreedly_transaction(fresh_spreedly_transaction_data);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/create_charge_worker',
      type: 'POST',
      data: fresh_spreedly_transaction_data,
      form_encoded: true,
      withCredentials: true
    });

    expect(cc_processor._add_processing_error).toHaveBeenCalledTimes(1);
    
    expect(spreedly_submit_transaction_response).toBe(false);

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
    const expected_spreedly_transaction_data = Object.assign({}, fresh_spreedly_transaction_data, { payment_token, payments: expected_payments });
    
    fresh_spreedly_transaction_data.payments = payments;
    fresh_spreedly_transaction_data.payment_token = payment_token;

    const spreedly_submit_transaction_response = await cc_processor._submit_spreedly_transaction(fresh_spreedly_transaction_data);

    expect(cc_processor._update_payments_token).toHaveBeenCalledTimes(1);
    expect(cc_processor._update_payments_token).toHaveBeenCalledWith(expected_payments, payment_token);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/shop/carts/submit',
      type: 'POST',
      data: expected_spreedly_transaction_data,
      form_encoded: true,
      withCredentials: true
    });

    expect(spreedly_submit_transaction_response).toBe(successful_transaction_response);

    cc_processor._update_payments_token.mockRestore();
    cc_processor._request.mockRestore();
  });
});

describe('spreedly_url', () => {
  test('returns the spreedly url with the spreedly environment key set to the one that was passed in as an argument', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const spreedly_environment_key = '12345';
    const spreedly_url_response = cc_processor.spreedly_url(spreedly_environment_key);

    expect(spreedly_url_response).toBe(`https://core.spreedly.com/v1/payment_methods.json?environment_key=${spreedly_environment_key}`)
  });
});

describe('_get_spreedly_env_key', () => {
  test('returns the spreedly environment key that was passed in as a setting', () => {
    const copied_hmt_client_processor_settings = JSON.parse(JSON.stringify(hmt_client_processor_settings));

    const env_key = '12345';
    copied_hmt_client_processor_settings.spreedly_environment_key = env_key;

    const cc_processor = new hmt_client_processor(copied_hmt_client_processor_settings);

    const spreedly_env_key_response = cc_processor._get_spreedly_env_key();

    expect(spreedly_env_key_response).toBe(env_key)
  });

  test('returns empty string if no environment key was passed in as a setting', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const spreedly_env_key_response = cc_processor._get_spreedly_env_key();

    expect(spreedly_env_key_response).toBe('');
  });
});