import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class IssueBadgeApi implements ICredentialType {
	name = 'issueBadgeApi';
	displayName = 'IssueBadge API';
	documentationUrl = 'https://documenter.getpostman.com/view/19911979/2sA2r9X4Aj#517772b8-455a-4374-a289-3d1b4264c069';
	
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your IssueBadge API key',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{ $credentials.apiKey }}',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.issuebadge.com',
			url: '/api/v1/validate-key',
			method: 'POST',
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'success',
					value: true,
					message: 'API key is valid',
				},
			},
		],
	};
}