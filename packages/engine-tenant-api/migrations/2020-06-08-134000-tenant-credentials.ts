import { escapeValue, MigrationBuilder } from '@contember/database-migrations'
import { computeTokenHash, TenantMigrationArgs } from '../'

export default async function (builder: MigrationBuilder, args: TenantMigrationArgs) {
	if (args.credentials.loginToken) {
		const tokenHash = computeTokenHash(args.credentials.loginToken)
		builder.sql(`
			WITH identity AS (
			    INSERT INTO identity(id, parent_id, roles, description, created_at)
				VALUES (public."uuid_generate_v4"(), NULL, '["login"]'::JSONB, 'Login key', now()) RETURNING id
			)
			INSERT INTO api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
			SELECT public."uuid_generate_v4"(), ${escapeValue(tokenHash)}, 'permanent', identity.id, NULL, NULL, NULL, now()
			FROM identity
			`)
	}

	if (!args.credentials.rootToken) {
		throw 'Please specify a root token using CONTEMBER_ROOT_TOKEN env variable.'
	}

	if (args.credentials.rootEmail && !args.credentials.rootPassword) {
		throw 'Please specify a root password using CONTEMBER_ROOT_PASSWORD env variable.'
	}
	const rootEmail = args.credentials.rootPassword ? args.credentials.rootEmail || 'root@localhost' : null
	const rootPassword = args.credentials.rootPassword || null
	const rootPasswordHash = rootPassword ? await args.providers.bcrypt(rootPassword) : null

	const rootTokenHash = args.credentials.rootToken ? computeTokenHash(args.credentials.rootToken) : null

	builder.sql(`
			WITH identity AS (
				INSERT INTO identity(id, parent_id, roles, description, created_at)
				VALUES (
						public."uuid_generate_v4"(),
						NULL,
						'["super_admin"]'::JSONB
							|| (CASE WHEN ${escapeValue(rootEmail)} IS NOT NULL THEN '["person"]'::JSONB ELSE '[]'::JSONB END),
						'Superadmin',
						now()
					) RETURNING id
			),
			person AS (
				INSERT INTO person(id, email, password_hash, identity_id)
				SELECT public."uuid_generate_v4"(), ${escapeValue(rootEmail)}, ${escapeValue(rootPasswordHash)}, identity.id
				FROM identity
				WHERE ${escapeValue(rootEmail)} IS NOT NULL
			    RETURNING id
			),
			api_key AS (
				INSERT INTO api_key (id, token_hash, type, identity_id, disabled_at, expires_at, expiration, created_at)
				SELECT public."uuid_generate_v4"(), ${escapeValue(rootTokenHash)}, 'permanent', identity.id, NULL, NULL, NULL, now()
				FROM identity WHERE ${escapeValue(rootTokenHash)} IS NOT NULL
			    RETURNING id
			)
			SELECT * FROM person, api_key
		`)
}
