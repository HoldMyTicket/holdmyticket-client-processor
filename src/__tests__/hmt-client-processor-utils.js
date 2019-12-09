import hmt_client_processor from '../hmt-client-processor';

const hmt_client_processor_settings = {
  api_url : 'http://holdmyticket.loc/api/',
  env : 'dev',
  api_url_suffix : ''
}

describe('_update_payments_token', () => {
  test('returns array of object(s) with payment token property set if payment type is credit', () => {
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
});

describe('_format_card_for_save', () => {
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
    test(`returned false because of missing ${card_key}`, () => {
      const incorrect_card = Object.assign({}, card);
      delete incorrect_card[card_key];

      const formatted_card = cc_processor._format_card_for_save(incorrect_card);

      expect(formatted_card).toBe(false);
    });
  });

  test('card object is formatted correctly', () => {
    const formatted_card = cc_processor._format_card_for_save(card);
    expect(formatted_card).toEqual(correct_card);
  });
});

describe('_format_phone_number', () => {
  test('returns phone number with special characters removed', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);
  
    const phone_number = '(505)-555-5555';
  
    const expected_phone_number = '5055555555';
  
    const formatted_phone_number = cc_processor._format_phone_number(phone_number);
  
    expect(formatted_phone_number).toBe(expected_phone_number);
  })
});

describe('_get_last_four', () => {
  test('returns last four digits of credit card number string', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);
  
    const cc_num = '4111 1111 1111 1234';
  
    const expected_last_four = '1234';
  
    const cc_last_four = cc_processor._get_last_four(cc_num);
    
    expect(cc_last_four).toBe(expected_last_four);
  });
});

describe('_remember_card_data', () => {
  const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

  const remember_card_data_map = {
    card: 'card_data',
    token: 'card_token',
    processor: 'card_processor',
    ticket_key: 'card_ticket_key'
  };

  Object.keys(remember_card_data_map).forEach((remember_card_data_key) => {

    test(`${remember_card_data_map[remember_card_data_key]} is remembered`, () => {
      const args = { [remember_card_data_key]: '1234' };

      cc_processor._remember_card_data(args);

      const processor_remember_key = remember_card_data_map[remember_card_data_key];
      const expected_remembered_card_data = args[remember_card_data_key];

      expect(cc_processor).toHaveProperty(processor_remember_key, expected_remembered_card_data);
    });

  });
});

describe('_clear_state', () => {
  const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

  const error_arrays_that_should_be_empty = ['errors_internal', 'errors_processing'];
  const props_that_should_be_deleted = ['card_data', 'card_token', 'card_processor', 'card_ticket_key'];

  error_arrays_that_should_be_empty.forEach(error_array_key => {

    test(`${error_array_key} array is empty`, () => {
      cc_processor[error_array_key] = [{ error: 'this is an error' }];
      cc_processor._clear_state();

      const cc_processor_error_array = cc_processor[error_array_key];
      expect(cc_processor_error_array).toHaveLength(0);
    });

  });

  props_that_should_be_deleted.forEach(card_data_prop => {

    test(`${card_data_prop} prop is deleted`, () => {
      cc_processor[card_data_prop] = '1234';
      cc_processor._clear_state();

      expect(cc_processor).not.toHaveProperty(card_data_prop);
    });

  });
});

describe('_remove_sensitive_card_data', () => {
  const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

  const sensitive_card_data_props = ['cc_no', 'cc_cvc', 'cc_expiry', 'cc_name', 'encryptedTrack1', 'encryptedTrack2', 'ksn'];

  sensitive_card_data_props.forEach((sensitive_card_data_prop) => {

    test(`${sensitive_card_data_prop} is deleted`, () => {
      const card_data = { [sensitive_card_data_prop]: 'some test data' };

      const cleaned_card_data = cc_processor._remove_sensitive_card_data(card_data);

      expect(cleaned_card_data).not.toHaveProperty(sensitive_card_data_prop);
    });

  });
});