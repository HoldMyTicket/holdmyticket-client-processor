import hmt_client_processor from '../hmt-client-processor';
import { fullsteam_transaction_data } from '../test/test-data';

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

describe('_logger', () => {
  beforeEach(() => {
    mockXHR = createMockXHR();
    window.XMLHttpRequest = jest.fn(() => mockXHR);
  });

  afterEach(() => {
    window.XMLHttpRequest = oldXMLHttpRequest;
  });

  test('makes request with correct data', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_prepare_for_log');
    jest.spyOn(cc_processor, 'url');

    const prepare_for_log_response = {
      url: 'http://google.com',
      data: {},
      xhr: {
        readyState: 4,
        response: null,
        responseText: '{}',
        responseURL: null,
        responseXML: null,
        status: null,
        statusText: null,
        timeout: null
      },
      browser_info: {
        platform: '',
        userAgent: '',
        vendor: '',
        vendorSub: ''
      }
    };

    cc_processor._prepare_for_log.mockImplementationOnce(() => prepare_for_log_response);
    cc_processor.url.mockImplementationOnce(() => 'http://holdmyticket.loc/api/shop/processors/logme2342311');

    const logger_data = { test: 'test value' };

    cc_processor._logger('http://google.com', logger_data, mockXHR, {});
    
    expect(mockXHR.open).toHaveBeenCalledTimes(1);
    expect(mockXHR.open).toHaveBeenCalledWith('POST', 'http://holdmyticket.loc/api/shop/processors/logme2342311', true);

    expect(mockXHR).toHaveProperty('withCredentials', true);

    expect(mockXHR.setRequestHeader).toHaveBeenCalledTimes(1);
    expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('content-type', 'application/json;charset=UTF-8');

    expect(mockXHR.send).toHaveBeenCalledTimes(1);
    expect(mockXHR.send).toHaveBeenCalledWith(JSON.stringify(prepare_for_log_response));

    cc_processor._prepare_for_log.mockRestore();
    cc_processor.url.mockRestore();
  });
});

describe('_log_bad_trans', () => {
  beforeEach(() => {
    mockXHR = createMockXHR();
    window.XMLHttpRequest = jest.fn(() => mockXHR);
  });

  afterEach(() => {
    window.XMLHttpRequest = oldXMLHttpRequest;
  });

  test('makes request with correct data', () => {
    const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

    jest.spyOn(cc_processor, '_copy_object');
    jest.spyOn(cc_processor, 'url');
    jest.spyOn(cc_processor, '_serializer');

    cc_processor._copy_object.mockImplementationOnce((obj) => Object.assign({}, obj));
    cc_processor.url.mockImplementationOnce(() => 'http://holdmyticket.loc/api/shop/carts/log_bad_trans');
    cc_processor._serializer.mockImplementationOnce(() => undefined);

    cc_processor._log_bad_trans(fullsteam_transaction_data);
    
    expect(mockXHR.open).toHaveBeenCalledTimes(1);
    expect(mockXHR.open).toHaveBeenCalledWith('POST', 'http://holdmyticket.loc/api/shop/carts/log_bad_trans', true);

    expect(mockXHR).toHaveProperty('withCredentials', true);

    expect(mockXHR.setRequestHeader).toHaveBeenCalledTimes(1);
    expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');

    expect(mockXHR.send).toHaveBeenCalledTimes(1);
    // expect(mockXHR.send).toHaveBeenCalledWith(fullsteam_transaction_data);

    cc_processor._copy_object.mockRestore();
    cc_processor.url.mockRestore();
    cc_processor._serializer.mockRestore();
  });
});