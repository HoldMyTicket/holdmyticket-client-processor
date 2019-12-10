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

describe('_save_card', () => {
  beforeEach(() => {
    fresh_card_data = Object.assign({}, card_data);
    fresh_successful_transaction_response = Object.assign({}, successful_transaction_response);

    fresh_spreedly_transaction_data = Object.assign({}, spreedly_transaction_data);
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

  // test('saves card to webuser for fullsteam', async () => {

  // });
});

// describe('_save_card_to_webuser', () => {

// });

// describe('_webuser_save_card', () => {

// });