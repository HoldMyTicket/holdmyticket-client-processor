import hmt_client_processor from '../hmt-client-processor';

const hmt_client_processor_settings = {
  api_url : 'http://holdmyticket.loc/api/',
  env : 'dev',
  api_url_suffix : ''
}

const oldXMLHttpRequest = window.XMLHttpRequest;
let mockXHR = null;

const createMockXHR = (responseJSON) => {
  const mockXHR = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      readyState: 4,
      responseText: JSON.stringify(
          responseJSON || {}
      )
  };
  return mockXHR;
}

describe('_request', () => {
  beforeEach(() => {
    mockXHR = createMockXHR();
    window.XMLHttpRequest = jest.fn(() => mockXHR);
  });

  afterEach(() => {
    window.XMLHttpRequest = oldXMLHttpRequest;
  });

  test('makes get request', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const request_options = {
      url: 'http://google.com'
    };
    const request_response = cc_processor._request(request_options);
    
    expect(mockXHR.open).toHaveBeenCalledTimes(1);
    expect(mockXHR.open).toHaveBeenCalledWith('GET', request_options.url);

    expect(mockXHR.send).toHaveBeenCalledTimes(1);
    expect(mockXHR.send).toHaveBeenCalledWith(undefined);
  });

  test('makes post request', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const request_options = {
      url: 'http://google.com',
      type: 'POST',
      data: { test: 'this is a test value' }
    };
    const request_response = cc_processor._request(request_options);
    
    expect(mockXHR.open).toHaveBeenCalledTimes(1);
    expect(mockXHR.open).toHaveBeenCalledWith('POST', request_options.url);

    expect(mockXHR.send).toHaveBeenCalledTimes(1);
    expect(mockXHR.send).toHaveBeenCalledWith(request_options.data);
  });

  test('if json option is used then the content-type header is set correctly', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const request_options = {
      url: 'http://google.com',
      type: 'POST',
      data: { test: 'this is a test value' },
      json: true
    };
    const request_response = cc_processor._request(request_options);

    expect(mockXHR.setRequestHeader).toHaveBeenCalledTimes(1);
    expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('content-type', 'application/json;charset=UTF-8');
  });

  test('if json option is used then the data is JSON stringified', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const request_options = {
      url: 'http://google.com',
      type: 'POST',
      data: { test: 'this is a test value' },
      json: true
    };
    const request_response = cc_processor._request(request_options);

    expect(mockXHR.send).toHaveBeenCalledTimes(1);
    expect(mockXHR.send).toHaveBeenCalledWith(JSON.stringify(request_options.data));
  });

  test('if form_encoded option is used then the content-type header is set correctly', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_serializer');
    cc_processor._serializer.mockImplementationOnce((obj, serialize_without_repeat) => undefined);

    const request_options = {
      url: 'http://google.com',
      type: 'POST',
      data: { test: 'this is a test value' },
      form_encoded: true
    };
    
    const request_response = cc_processor._request(request_options);

    expect(mockXHR.setRequestHeader).toHaveBeenCalledTimes(1);
    expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
  })

  test('if form_encoded option is used then the post data is serialized', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_serializer');
    cc_processor._serializer.mockImplementationOnce((obj, serialize_without_repeat) => undefined);

    const original_request_options = {
      url: 'http://google.com',
      type: 'POST',
      data: { test: 'this is a test value' },
      form_encoded: true
    };
    const copied_request_options = Object.assign({}, original_request_options);
    const request_response = cc_processor._request(copied_request_options);

    expect(cc_processor._serializer).toHaveBeenCalledTimes(1);
    expect(cc_processor._serializer).toHaveBeenCalledWith(original_request_options.data);
  })

  test('if auth_key option is used then the authenticationKey header is set correctly', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const request_options = {
      url: 'http://google.com',
      type: 'POST',
      data: { test: 'this is a test value' },
      auth_key: '12345'
    };
    const request_response = cc_processor._request(request_options);

    expect(mockXHR.setRequestHeader).toHaveBeenCalledTimes(1);
    expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('authenticationKey', request_options.auth_key);
  });

  test('resolves with _xhr_success if status is 200', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_logger');
    jest.spyOn(cc_processor, '_xhr_success');
    cc_processor._logger.mockImplementationOnce((url, data, xhr, opts) => undefined);
    cc_processor._xhr_success.mockImplementationOnce((xhr, opts) => undefined);

    const request_options = {
      url: 'http://google.com'
    };
    const request_response = cc_processor._request(request_options);

    mockXHR.status = 200;
    mockXHR.onreadystatechange();

    expect(cc_processor._logger).toHaveBeenCalledTimes(1);
    expect(cc_processor._logger).toHaveBeenCalledWith(request_options.url, undefined, mockXHR, request_options);

    expect(cc_processor._xhr_success).toHaveBeenCalledTimes(1);
    expect(cc_processor._xhr_success).toHaveBeenCalledWith(mockXHR);
    
    cc_processor._logger.mockRestore();
    cc_processor._xhr_success.mockRestore();
  });

  test('resolves with _xhr_fail if status is NOT 200', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_logger');
    jest.spyOn(cc_processor, '_xhr_fail');
    cc_processor._logger.mockImplementationOnce((url, data, xhr, opts) => undefined);
    cc_processor._xhr_fail.mockImplementationOnce((xhr, url, opts) => undefined);

    const request_options = {
      url: 'http://google.com'
    };
    const request_response = cc_processor._request(request_options);

    mockXHR.onreadystatechange();

    expect(cc_processor._logger).toHaveBeenCalledTimes(1);
    expect(cc_processor._logger).toHaveBeenCalledWith(request_options.url, undefined, mockXHR, request_options);

    expect(cc_processor._xhr_fail).toHaveBeenCalledTimes(1);
    expect(cc_processor._xhr_fail).toHaveBeenCalledWith(mockXHR, request_options.url);
    
    cc_processor._logger.mockRestore();
    cc_processor._xhr_fail.mockRestore();
  });
});

describe('_xhr_success', () => {
  const test_response =  { status: 'ok', response: 'hey this was a success!' };

  beforeEach(() => {
    mockXHR = createMockXHR(test_response);
    window.XMLHttpRequest = jest.fn(() => mockXHR);
  });

  afterEach(() => {
    window.XMLHttpRequest = oldXMLHttpRequest;
  });

  test('returns the JSON parsed xhr response text', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const xhr_success_response = cc_processor._xhr_success(mockXHR);

    expect(xhr_success_response).toEqual(test_response);
  });

  test('if xhr statusText exists then it is returned in the response', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    mockXHR.statusText = 'OK';
    const xhr_success_response = cc_processor._xhr_success(mockXHR);

    const test_response_with_xhr_status_text = Object.assign({}, test_response, { statusText: 'OK' });
    expect(xhr_success_response).toEqual(test_response_with_xhr_status_text);
  });
});

describe('_xhr_fail', () => {

  afterEach(() => {
    window.XMLHttpRequest = oldXMLHttpRequest;
  });

  test('returns the JSON parsed xhr response text', () => {
    const test_response =  { response: 'hey this was a failure' };

    mockXHR = createMockXHR(test_response);
    window.XMLHttpRequest = jest.fn(() => mockXHR);

    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    const xhr_fail_response = cc_processor._xhr_fail(mockXHR);

    const new_test_response = Object.assign({}, test_response, { status: 'error', statusText: 'ERROR' });
    expect(xhr_fail_response).toEqual(new_test_response);
  });

  test('if response already has status prop then the initial status prop is returned', () => {
    const test_response =  { status: 'testing', response: 'hey this was a failure' };

    mockXHR = createMockXHR(test_response);
    window.XMLHttpRequest = jest.fn(() => mockXHR);

    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);
    
    const xhr_fail_response = cc_processor._xhr_fail(mockXHR);

    const new_test_response = Object.assign({}, test_response, { statusText: 'ERROR' });
    expect(xhr_fail_response).toEqual(new_test_response);
  });
});