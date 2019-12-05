import hmt_client_processor from '../hmt-client-processor';

const hmt_client_processor_settings = {
  api_url : 'http://holdmyticket.loc/api/',
  env : 'dev',
  api_url_suffix : ''
}

/*
  Utilities
*/

test('_update_payments_token should return array of object(s) with payment token property set if payment type is credit', () => {
  const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

  const payment_token = 'aaa12345bbbb';
  const payments = [
    { type: 'cash' },
    { type: 'credit' }
  ];

  const expected_payments = [
    { type: 'cash' },
    { type: 'credit', payment_token: payment_token }
  ];

  const updated_payments = cc_processor._update_payments_token(payments, payment_token);
  expect(updated_payments).toEqual(expected_payments);
});

test('_format_card_for_save should return card object or false when missing data', () => {
  const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

  const card = {
    full_name: 'full name',
    number: '4111 1111 1111 1234',
    month: '11',
    year: '2024'
  };

  const correct_card = {
    full_name: 'full name',
    last_four: '1234',
    exp_month: '11',
    exp_year: '2024'
  };

  Object.keys(card).forEach((card_key) => {
    const incorrect_card = Object.assign({}, card);
    delete incorrect_card[card_key];

    const formatted_card = cc_processor._format_card_for_save(incorrect_card);

    expect(formatted_card).toBe(false);
  });

  const formatted_card = cc_processor._format_card_for_save(card);
  expect(formatted_card).toEqual(correct_card);
});

test('_format_phone_number removes all special characters', () => {
  const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

  const phone_number = '(505)-555-5555';

  const expected_phone_number = '5055555555';

  const formatted_phone_number = cc_processor._format_phone_number(phone_number);

  expect(formatted_phone_number).toBe(expected_phone_number);
})

test('_get_last_four gets last four digits of credit card number string', () => {
  const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

  const cc_num = '4111 1111 1111 1234';

  const expected_last_four = '1234';

  const cc_last_four = cc_processor._get_last_four(cc_num);
  
  expect(cc_last_four).toBe(expected_last_four);
})

test('_remember_card_data', () => {return false});

test('_clear_state', () => {return false});

test('_remove_sensitive_card_data', () => {return false});