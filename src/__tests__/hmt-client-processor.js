import hmt_client_processor from '../hmt-client-processor';

const hmt_client_processor_settings = {
  api_url : 'http://holdmyticket.loc/api/',
  env : 'dev',
  api_url_suffix : ''
}

test('_format_phone_number removes all special characters', () => {
  const cc_processor = new hmt_client_processor(hmt_client_processor_settings);

  const expected_phone_number = '5055555555';
  const phone_number = '(505)-555-5555';

  const formatted_phone_number = cc_processor._format_phone_number(phone_number);

  expect(formatted_phone_number).toBe(expected_phone_number);
})