import hmt_client_processor from '../hmt-client-processor';
import {
  successful_transaction_response,
  spreedly_card_data,
  spreedly_transaction_data,
  spreedly_payment_token,
  spreedly_token_response_success
} from '../test/test-data';

const hmt_client_processor_settings = {
  api_url : 'http://holdmyticket.loc/api/',
  env : 'dev',
  api_url_suffix : ''
}

let fresh_spreedly_transaction_data;
let fresh_spreedly_card_data;

describe('_submit_spreedly', () => {
  beforeEach(() => {
    // resetting the data variables before each test to ensure we are using fresh test data
    // that hasn't been already mutated from a previous test
    fresh_spreedly_transaction_data = Object.assign({}, spreedly_transaction_data);
    fresh_spreedly_card_data = Object.assign({}, spreedly_card_data);
  });

  test('submits the spreedly transaction if payment token already exists', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_submit_spreedly_transaction');
    cc_processor._submit_spreedly_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));

    const spreedly_transaction_with_payment_token = Object.assign({}, fresh_spreedly_transaction_data, {payment_token: spreedly_payment_token})

    const cc_processor_response = await cc_processor._submit_spreedly(fresh_spreedly_card_data, spreedly_transaction_with_payment_token);

    expect(cc_processor._submit_spreedly_transaction).toHaveBeenCalledTimes(1);
    expect(cc_processor._submit_spreedly_transaction).toHaveBeenCalledWith(spreedly_transaction_with_payment_token);
    expect(cc_processor_response).toBe(successful_transaction_response);
    
    cc_processor._submit_spreedly_transaction.mockRestore();
  });

  test('submits the spreedly transaction if payment token does NOT exist', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_spreedly_token');
    jest.spyOn(cc_processor, '_submit_spreedly_transaction');
    cc_processor._get_spreedly_token.mockImplementationOnce((card, spreedly_environment_key, cb) => Promise.resolve(spreedly_token_response_success));
    cc_processor._submit_spreedly_transaction.mockImplementationOnce((transaction) => Promise.resolve(successful_transaction_response));
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_spreedly_card_data, fresh_spreedly_transaction_data);
    
    expect(cc_processor._get_spreedly_token).toHaveBeenCalledTimes(1);
    expect(cc_processor._get_spreedly_token).toHaveBeenCalledWith(fresh_spreedly_card_data, fresh_spreedly_transaction_data.spreedly_environment_key);

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
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_spreedly_card_data, fresh_spreedly_transaction_data);

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
    
    const cc_processor_response = await cc_processor._submit_spreedly(fresh_spreedly_card_data, fresh_spreedly_transaction_data);

    expect(cc_processor._save_card).toHaveBeenCalledTimes(1);
    expect(cc_processor._save_card).toHaveBeenCalledWith(fresh_spreedly_card_data, fresh_spreedly_transaction_data, 'fullsteam');

    cc_processor._get_spreedly_token.mockRestore();
    cc_processor._submit_spreedly_transaction.mockRestore();
    cc_processor._save_card_to_webuser.mockRestore();
    cc_processor._save_card.mockRestore();
  })
});