import hmt_client_processor from '../hmt-client-processor';
import {
  transaction_data_with_survey,
  correct_transaction_survey_form_data
} from '../test/test-data';

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

describe('_get_browser_info', () => {
  let navigatorMock;
  let navigatorTestObject = {
    platform: 'test platform',
    userAgent: 'test user agent',
    vendor: 'test vendor',
    vendorSub: 'test vendor sub'
  };

  beforeEach(() => {
    navigatorMock = jest.spyOn(global, 'navigator', 'get');
  });

  afterEach(() => {
    navigatorMock.mockRestore();
  });

  test('returns object with browser info', () => {
    navigatorMock.mockImplementation(() => navigatorTestObject);

    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const get_browser_info_response = cc_processor._get_browser_info();

    expect(get_browser_info_response).toEqual(navigatorTestObject);
  });

  Object.keys(navigatorTestObject).forEach(key => {

    test(`if navigator ${key} key does not exist an empty string is set as the value`, () => {
      const navigator_object_missing_data = Object.assign({}, navigatorTestObject);
      delete navigator_object_missing_data[key];

      navigatorMock.mockImplementation(() => navigator_object_missing_data);
      
      const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

      const get_browser_info_response = cc_processor._get_browser_info();

      expect(get_browser_info_response).toHaveProperty(key, '');
    });

  });
});

describe('_serializer', () => {
  test('returns correct stringified transaction data with survey', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const serializer_response = cc_processor._serializer(transaction_data_with_survey);

    expect(serializer_response).toBe(correct_transaction_survey_form_data);
  });
});

describe('_prepare_transaction', () => {
  test('formats the phone number in the transaction object', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_format_phone_number');

    const test_transaction = { f_name: 'Joseph', l_name: 'Perez', phone: '(505)-555-5555' };
    const prepare_transaction_response = cc_processor._prepare_transaction(test_transaction);

    expect(cc_processor._format_phone_number).toHaveBeenCalledTimes(1);
    expect(cc_processor._format_phone_number).toHaveBeenCalledWith('(505)-555-5555');

    expect(prepare_transaction_response).toEqual({ f_name: 'Joseph', l_name: 'Perez', phone: '5055555555' });
  })
});

describe('_add_internal_error', () => {
  test('pushes error message to the errors_internal array', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const error_message = 'this is a test internal error message';

    const add_internal_error_response = cc_processor._add_internal_error(error_message);

    expect(cc_processor.errors_internal).toHaveLength(1);
    expect(cc_processor.errors_internal[0]).toBe(error_message)

    expect(add_internal_error_response).toBe(false);
  });
});

describe('_add_processing_error', () => {
  test('pushes error message to the errors_processing array', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const error_message = 'this is a test processing error message';

    const add_processing_error_response = cc_processor._add_processing_error(error_message);

    expect(cc_processor.errors_processing).toHaveLength(1);
    expect(cc_processor.errors_processing[0]).toBe(error_message)

    expect(add_processing_error_response).toBe(false);
  });
});

describe('_copy_object', () => {
  test('returns copy of object', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const test_object = { name: 'Joseph Perez', middleInitial: 'A' };

    const copy_object_response = cc_processor._copy_object(test_object);
    
    expect(copy_object_response).toEqual(test_object);
    expect(copy_object_response).not.toBe(test_object);
  });

  test('returns false if data passed in is not typeof object', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const copy_object_response = cc_processor._copy_object('test');
    
    expect(copy_object_response).toBe(false);
  });

  test('returns false if error is thrown', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const test_object = { name: 'Joseph Perez', middleInitial: 'A', num: BigInt(2) };
    const copy_object_response = cc_processor._copy_object(test_object);
    
    expect(copy_object_response).toBe(false);
  });
});

describe('_check_charge_worker', () => {
  test('resolves promise when worker status is DONE', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve({
      status: 'ok',
      worker: {
        status: 'done', 
        log: { ticket_key: '1234' }
      }
    }));

    const worker_reference = '12345';
    const check_charge_worker_response = await cc_processor._check_charge_worker(worker_reference);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: `http://holdmyticket.loc/api/shop/carts/get_charge_worker_status/${worker_reference}`,
      withCredentials: true
    });
    
    expect(check_charge_worker_response).toEqual({
      status: 'ok',
      msg: 'Charge successful',
      ticket_key: '1234'
    });
    
    cc_processor._request.mockRestore();
  });

  test('resolves promise when worker status is TERMINATED', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve({
      status: 'ok',
      worker: {
        status: 'terminated'
      }
    }));

    const worker_reference = '12345';
    const check_charge_worker_response = await cc_processor._check_charge_worker(worker_reference);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: `http://holdmyticket.loc/api/shop/carts/get_charge_worker_status/${worker_reference}`,
      withCredentials: true
    });
    
    expect(check_charge_worker_response).toEqual({
      status: 'error',
      msg: 'There was an error processing your transaction.'
    });
    
    cc_processor._request.mockRestore();
  });

  test('resolves promise when worker status is ERROR', async () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_request');
    cc_processor._request.mockImplementationOnce((opts) => Promise.resolve({
      status: 'ok',
      worker: {
        status: 'error', 
        log: { status: 'error', msg: 'An error occured' }
      }
    }));

    const worker_reference = '12345';
    const check_charge_worker_response = await cc_processor._check_charge_worker(worker_reference);

    expect(cc_processor._request).toHaveBeenCalledTimes(1);
    expect(cc_processor._request).toHaveBeenCalledWith({
      url: `http://holdmyticket.loc/api/shop/carts/get_charge_worker_status/${worker_reference}`,
      withCredentials: true
    });
    
    expect(check_charge_worker_response).toEqual({
      status: 'error',
      msg: 'An error occured'
    });
    
    cc_processor._request.mockRestore();
  });
  
  // test('schedules another get_charge_worker_status request to run in 5 seconds if worker status is WAITING', async () => {
  //   jest.useFakeTimers();

  //   const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

  //   jest.spyOn(cc_processor, '_request');
  //   cc_processor._request.mockImplementationOnce((opts) => Promise.resolve({
  //     status: 'ok',
  //     worker: {
  //       status: 'waiting'
  //     }
  //   }));
    
    // const worker_reference = '12345';
    // const check_charge_worker_response = cc_processor._check_charge_worker(worker_reference);

    // more info here on why this call is here - https://stackoverflow.com/questions/52417761/testing-a-recursive-polling-function-with-jest-and-fake-timers
    // await Promise.resolve();

    // expect(cc_processor._request).toHaveBeenCalledTimes(1);
    // expect(cc_processor._request).toHaveBeenCalledWith({
    //   url: `http://holdmyticket.loc/api/shop/carts/get_charge_worker_status/${worker_reference}`,
    //   withCredentials: true
    // });

    // expect(setTimeout).toHaveBeenCalledTimes(1);
    // expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
    
  //   cc_processor._request.mockRestore();
  // });
});