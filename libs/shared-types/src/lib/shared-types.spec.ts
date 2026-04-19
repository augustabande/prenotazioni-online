import { ApiResponse } from './shared-types';

describe('shared-types', () => {
  it('should define ApiResponse interface', () => {
    const response: ApiResponse<string> = { data: 'test', message: 'ok', statusCode: 200 };
    expect(response.statusCode).toBe(200);
  });
});
