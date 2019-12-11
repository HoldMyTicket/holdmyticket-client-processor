import hmt_client_processor from '../hmt-client-processor';
import {
  successful_transaction_response,
  card_data,
  spreedly_transaction_data,
  spreedly_payment_token,
  spreedly_token_response_success,
  spreedly_token_response_error,
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
let fresh_successful_transaction_response;

let fresh_spreedly_transaction_data;
let fresh_spreedly_token_response_error;

let fresh_fullsteam_transaction_data;
let fresh_fullsteam_authentication_key_response_success;
let fresh_fullsteam_token_response_success;

describe('save_card', () => {
  beforeEach(() => {
    fresh_card_data = Object.assign({}, card_data);
    fresh_successful_transaction_response = Object.assign({}, successful_transaction_response);

    fresh_spreedly_transaction_data = Object.assign({}, spreedly_transaction_data);
  });

  test('calls the internal _save_card method with correct data', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_save_card');
    cc_processor._save_card.mockImplementationOnce(() => undefined);

    cc_processor.save_card(fresh_card_data, fresh_spreedly_transaction_data, 'spreedly', fresh_successful_transaction_response.ticket_key);

    expect(cc_processor._save_card).toHaveBeenCalledTimes(1);
    expect(cc_processor._save_card).toHaveBeenCalledWith(fresh_card_data, fresh_spreedly_transaction_data, 'spreedly', fresh_successful_transaction_response.ticket_key);

    cc_processor._save_card.mockRestore();
  });
});

describe('webuser_save_card', () => {
  beforeEach(() => {
    fresh_card_data = Object.assign({}, card_data);
  });

  test('calls the internal _webuser_save_card method with correct data', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_webuser_save_card');
    cc_processor._webuser_save_card.mockImplementationOnce(() => undefined);

    cc_processor.webuser_save_card(fresh_card_data, { test: 'this is a test value' }, 1);

    expect(cc_processor._webuser_save_card).toHaveBeenCalledTimes(1);
    expect(cc_processor._webuser_save_card).toHaveBeenCalledWith(fresh_card_data, { test: 'this is a test value' }, 1, undefined);

    cc_processor._webuser_save_card.mockRestore();
  });
});

describe('_save_card', () => {
  beforeEach(() => {
    fresh_card_data = Object.assign({}, card_data);
    fresh_successful_transaction_response = Object.assign({}, successful_transaction_response);

    fresh_spreedly_transaction_data = Object.assign({}, spreedly_transaction_data);

    fresh_fullsteam_transaction_data = Object.assign({}, fullsteam_transaction_data);
    fresh_fullsteam_authentication_key_response_success = Object.assign({}, fullsteam_authentication_key_response_success);
    fresh_fullsteam_token_response_success = Object.assign({}, fullsteam_token_response_success);
  });

  test('calls _save_card_to_webuser for spreedly with correct data', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_spreedly_token');
    jest.spyOn(cc_processor, '_save_card_to_webuser');
    cc_processor._get_spreedly_token.mockImplementationOnce((card, spreedly_environment_key, cb) => Promise.resolve(spreedly_token_response_success));
    cc_processor._save_card_to_webuser.mockImplementationOnce(args => undefined);

    await cc_processor._save_card(fresh_card_data, fresh_spreedly_transaction_data, 'spreedly', fresh_successful_transaction_response.ticket_key);

    expect(cc_processor._get_spreedly_token).toHaveBeenCalledTimes(1);
    expect(cc_processor._get_spreedly_token).toHaveBeenCalledWith(fresh_card_data, fresh_spreedly_transaction_data.spreedly_environment_key);

    expect(cc_processor._save_card_to_webuser).toHaveBeenCalledTimes(1);
    expect(cc_processor._save_card_to_webuser).toHaveBeenCalledWith({
      card: fresh_card_data.payment_method.credit_card,
      processor: 'spreedly',
      ticket_key: fresh_successful_transaction_response.ticket_key,
      token: spreedly_token_response_success.transaction.payment_method.token
    });

    cc_processor._get_spreedly_token.mockRestore();
    cc_processor._save_card_to_webuser.mockRestore();
  });

  test('calls _save_card_to_webuser for fullsteam with correct data', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_get_fullsteam_auth_key');
    jest.spyOn(cc_processor, '_get_fullsteam_token');
    jest.spyOn(cc_processor, '_save_card_to_webuser');
    cc_processor._get_fullsteam_auth_key.mockImplementationOnce(() => Promise.resolve(fresh_fullsteam_authentication_key_response_success));
    cc_processor._get_fullsteam_token.mockImplementationOnce((card, transaction, auth_key) => Promise.resolve(fresh_fullsteam_token_response_success));
    cc_processor._save_card_to_webuser.mockImplementationOnce(args => undefined);

    await cc_processor._save_card(fresh_card_data, fresh_fullsteam_transaction_data, 'fullsteam', fresh_successful_transaction_response.ticket_key);

    expect(cc_processor._get_fullsteam_auth_key).toHaveBeenCalledTimes(1);

    expect(cc_processor._get_fullsteam_token).toHaveBeenCalledTimes(1);
    expect(cc_processor._get_fullsteam_token).toHaveBeenCalledWith(fresh_card_data, fresh_fullsteam_transaction_data, fresh_fullsteam_authentication_key_response_success.authenticationKey);

    expect(cc_processor._save_card_to_webuser).toHaveBeenCalledTimes(1);
    expect(cc_processor._save_card_to_webuser).toHaveBeenCalledWith({
      card: fresh_card_data.payment_method.credit_card,
      processor: 'fullsteam',
      ticket_key: fresh_successful_transaction_response.ticket_key,
      token: fresh_fullsteam_token_response_success.token
    });

    cc_processor._get_fullsteam_auth_key.mockRestore();
    cc_processor._get_fullsteam_token.mockRestore();
    cc_processor._save_card_to_webuser.mockRestore();
  });
});

describe('_save_card_to_webuser', () => {
  beforeEach(() => {
    fresh_card_data = Object.assign({}, card_data);
    fresh_successful_transaction_response = Object.assign({}, successful_transaction_response);

    fresh_spreedly_transaction_data = Object.assign({}, spreedly_transaction_data);

    fresh_fullsteam_transaction_data = Object.assign({}, fullsteam_transaction_data);
    fresh_fullsteam_authentication_key_response_success = Object.assign({}, fullsteam_authentication_key_response_success);
    fresh_fullsteam_token_response_success = Object.assign({}, fullsteam_token_response_success);
  });

  test('calls request method with correct data', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_remember_card_data');
    jest.spyOn(cc_processor, '_format_card_for_save');
    jest.spyOn(cc_processor, '_request');
    jest.spyOn(cc_processor, 'url');
    cc_processor._request.mockImplementationOnce(() => Promise.resolve('fake response'));

    const args = {
      card: fresh_card_data.payment_method.credit_card,
      processor: 'fullsteam',
      ticket_key: fresh_successful_transaction_response.ticket_key,
      token: fresh_fullsteam_token_response_success.token
    };

    await cc_processor._save_card_to_webuser(args);

    expect(cc_processor._remember_card_data).toHaveBeenCalledTimes(1);
    expect(cc_processor._remember_card_data).toHaveBeenCalledWith(args);

    expect(cc_processor._format_card_for_save).toHaveBeenCalledTimes(1);
    expect(cc_processor._format_card_for_save).toHaveBeenCalledWith(cc_processor.card_data);

    expect(cc_processor.url).toHaveBeenCalledTimes(1);
    expect(cc_processor.url).toHaveBeenCalledWith('public/orders/save_additional_card', false);
    
    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: 'http://holdmyticket.loc/api/public/orders/save_additional_card',
      type: 'POST',
      withCredentials : false,
      data: {
        ticket_key: args.ticket_key,
        vault: args.processor,
        token: args.token,
        card_data: {
          full_name : args.card.full_name,
          last_four : '1111',
          exp_month : args.card.month,
          exp_year : args.card.year,
        }
      },
      form_encoded: true
    });

    cc_processor._remember_card_data.mockRestore();
    cc_processor._format_card_for_save.mockRestore();
    cc_processor._request.mockRestore();
    cc_processor.url.mockRestore();
  });
});

// describe('_webuser_save_card', () => {

// });