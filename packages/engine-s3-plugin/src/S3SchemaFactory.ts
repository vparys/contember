import { GraphQLFieldConfig, GraphQLSchema } from 'graphql'
import { GraphQLObjectsFactory } from '@contember/engine-common'
import { S3Acl, S3Service, S3ServiceFactory } from './S3Service'
import { resolveS3Config, S3Config } from './Config'
import { Schema } from '@contember/schema'
import { createObjectKeyVerifier, ObjectKeyVerifier } from './ObjectKeyVerifier'

interface Identity {
	projectRoles: string[]
}

type S3SchemaAcl = Record<
	string, // public/*.jpg
	{
		read?: boolean
		upload?: boolean
	}
>

export class S3SchemaFactory {
	private s3HeadersType: GraphQLFieldConfig<any, any> = {
		type: this.objectsFactory.createNotNull(
			this.objectsFactory.createList(
				this.objectsFactory.createNotNull(
					this.objectsFactory.createObjectType({
						name: 'S3Header',
						fields: {
							key: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							value: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
						},
					}),
				),
			),
		),
	}

	constructor(
		private readonly objectsFactory: GraphQLObjectsFactory,
		private readonly s3Config: S3Config | undefined,
		private readonly s3Factory: S3ServiceFactory,
	) {}

	public create(context: { schema: Schema; identity: Identity }): undefined | GraphQLSchema {
		if (!this.s3Config) {
			return undefined
		}
		const rules = context.identity.projectRoles.flatMap(it =>
			Object.entries((context.schema.acl.roles[it]?.s3 as S3SchemaAcl) || {}),
		)

		const allowedUploads = rules.filter(([, it]) => it.upload).map(([it]) => it)
		const allowedReads = rules.filter(([, it]) => it.read).map(([it]) => it)

		if (allowedUploads.length === 0 && allowedReads.length == 0) {
			return undefined
		}

		const s3Config = resolveS3Config(this.s3Config)
		const s3 = this.s3Factory.create(s3Config)
		const uploadMutation = this.createUploadMutation(s3Config, s3, allowedUploads)
		const readMutation = this.createReadMutation(s3, allowedReads)
		const mutation = {
			generateUploadUrl: uploadMutation as GraphQLFieldConfig<any, any, any>,
			generateReadUrl: readMutation,
		}
		return this.objectsFactory.createSchema({
			mutation: this.objectsFactory.createObjectType({
				name: 'Mutation',
				fields: () => mutation,
			}),
			query: this.objectsFactory.createObjectType({
				name: 'Query',
				fields: () => ({
					s3DummyQuery: {
						type: this.objectsFactory.string,
					},
				}),
			}),
		})
	}

	private createReadMutation(s3: S3Service, allowedKeyPatterns: string[]): GraphQLFieldConfig<any, any, any> {
		let verifier: ObjectKeyVerifier
		return {
			type: this.objectsFactory.createNotNull(
				this.objectsFactory.createObjectType({
					name: 'S3SignedRead',
					fields: {
						url: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
						headers: this.s3HeadersType,
						method: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
						objectKey: {
							type: this.objectsFactory.createNotNull(this.objectsFactory.string),
							description: `Allowed patterns:\n${allowedKeyPatterns.join('\n')}`,
						},
						bucket: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
					},
				}),
			),
			args: {
				objectKey: {
					type: this.objectsFactory.createNotNull(this.objectsFactory.string),
				},
				expiration: {
					type: this.objectsFactory.int,
				},
			},
			resolve: async (parent: any, args: { objectKey: string; expiration?: number }) => {
				if (!verifier) {
					verifier = createObjectKeyVerifier(allowedKeyPatterns)
				}
				return s3.getSignedReadUrl(args.objectKey, verifier, args.expiration)
			},
		} as GraphQLFieldConfig<any, any, any>
	}

	private createUploadMutation(
		s3Config: S3Config,
		s3: S3Service,
		allowedKeyPatterns: string[],
	): GraphQLFieldConfig<any, any, any> {
		let verifier: ObjectKeyVerifier
		return {
			type: this.objectsFactory.createNotNull(
				this.objectsFactory.createObjectType({
					name: 'S3SignedUpload',
					fields: {
						url: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
						headers: this.s3HeadersType,
						method: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
						objectKey: {
							type: this.objectsFactory.createNotNull(this.objectsFactory.string),
							description: `Allowed patterns:\n${allowedKeyPatterns.join('\n')}`,
						},
						bucket: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
						publicUrl: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
					},
				}),
			),
			args: {
				contentType: {
					type: this.objectsFactory.createNotNull(this.objectsFactory.string),
				},
				expiration: {
					type: this.objectsFactory.int,
				},
				prefix: {
					type: this.objectsFactory.string,
				},
				...(s3Config.noAcl
					? {}
					: {
							acl: {
								type: this.objectsFactory.createEnumType({
									name: 'S3Acl',
									values: {
										PUBLIC_READ: {},
										PRIVATE: {},
										NONE: {},
									},
								}),
							},
					  }),
			},
			resolve: async (
				parent: any,
				args: { contentType: string; acl?: string; expiration?: number; prefix?: string },
			) => {
				if (!verifier) {
					verifier = createObjectKeyVerifier(allowedKeyPatterns)
				}
				const aclMapping: Record<string, S3Acl> = {
					PUBLIC_READ: S3Acl.PublicRead,
					PRIVATE: S3Acl.Private,
					NONE: S3Acl.None,
				}
				const acl: S3Acl | undefined = args.acl ? aclMapping[args.acl] || undefined : undefined
				return s3.getSignedUploadUrl(args.contentType, verifier, acl, args.expiration, args.prefix)
			},
		}
	}
}
