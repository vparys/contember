import * as Typesafe from '@contember/typesafe'
import { Settings } from '@contember/schema'

export const settingsSchema = Typesafe.partial({
	useExistsInHasManyFilter: Typesafe.boolean,

	tenant: Typesafe.partial({
		inviteExpirationMinutes: Typesafe.integer,
	}),
	content: Typesafe.partial({
		useExistsInHasManyFilter: Typesafe.boolean,
		fullDateTimeResponse: Typesafe.boolean,
		shortDateResponse: Typesafe.boolean,
		uuidVersion: Typesafe.union(Typesafe.literal(4), Typesafe.literal(7)),
	}),
})

const settingSchemaCheck: Typesafe.Equals<Settings.Schema, ReturnType<typeof settingsSchema>> = true
