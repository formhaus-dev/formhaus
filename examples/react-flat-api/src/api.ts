export interface AccountRequest {
  first_name: string;
  last_name: string;
  email: string;
  account_type: 'personal' | 'business';
  company_name?: string;
  street: string;
  postal_code: string;
}

export interface ApiResponse {
  status: number;
  body: { id?: string; message?: string; errors?: Record<string, string[]> };
}

export interface MockApiOptions {
  latency?: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function check(request: AccountRequest): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (request.postal_code.startsWith('0')) errors.postal_code = ['We do not deliver to this postcode yet'];
  if (request.company_name?.toLowerCase().includes('test')) errors.company_name = ['This company is not in the register'];
  if (request.email.endsWith('@blocked.example')) errors.account = ['Sign-ups from this domain are paused'];
  if (request.email === 'taken@example.com') errors.email = ['This email already has an account'];
  if (/\d/.test(request.first_name)) errors.first_name = ['Use letters only'];
  return errors;
}

export function createMockApi({ latency = 0 }: MockApiOptions = {}) {
  const requests: AccountRequest[] = [];
  let offline = false;
  return {
    requests,
    setOffline(value: boolean) { offline = value; },
    async createAccount(request: AccountRequest): Promise<ApiResponse> {
      await wait(latency);
      if (offline) throw new TypeError('Failed to fetch');
      requests.push(request);
      const errors = check(request);
      if (Object.keys(errors).length > 0) return { status: 422, body: { message: 'The given data was invalid', errors } };
      return { status: 201, body: { id: `acc_${requests.length}` } };
    },
  };
}

export type MockApi = ReturnType<typeof createMockApi>;
