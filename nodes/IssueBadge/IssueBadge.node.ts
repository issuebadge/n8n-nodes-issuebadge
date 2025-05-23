import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { v4 as uuidv4 } from 'uuid';

export class IssueBadge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IssueBadge',
		name: 'issueBadge',
		group: ['communication'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Issue digital badges using IssueBadge API',
		defaults: {
			name: 'IssueBadge',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'issueBadgeApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://app.issuebadge.com',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Badge Issue',
						value: 'create',
						description: 'Issue a new badge to a recipient',
						action: 'Create a badge issue',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Badge ID',
				name: 'badgeId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'W238GD8PK',
				description: 'The ID of the badge to issue',
			},
			{
				displayName: 'Recipient Name',
				name: 'recipientName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'John Doe',
				description: 'Full name of the badge recipient',
			},
			{
				displayName: 'Recipient Email',
				name: 'recipientEmail',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'john.doe@example.com',
				description: 'Email address of the badge recipient',
			},
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'Leave empty to auto-generate',
				description: 'Optional idempotency key to prevent duplicate badge issues. Will be auto-generated if not provided.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'create') {
					const badgeId = this.getNodeParameter('badgeId', i) as string;
					const recipientName = this.getNodeParameter('recipientName', i) as string;
					const recipientEmail = this.getNodeParameter('recipientEmail', i) as string;
					let idempotencyKey = this.getNodeParameter('idempotencyKey', i) as string;

					// Generate idempotency key if not provided
					if (!idempotencyKey) {
						idempotencyKey = uuidv4();
					}

					const body = {
						name: recipientName,
						badge_id: badgeId,
						idempotency_key: idempotencyKey,
						email: recipientEmail,
					};

					const options: IHttpRequestOptions = {
						method: 'POST',
						url: '/api/v1/issue/create',
						body,
						json: true,
					};

					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'issueBadgeApi',
						options,
					);

					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ success: true, ...responseData }),
						{ itemData: { item: i } },
					);

					returnData.push(...executionData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}