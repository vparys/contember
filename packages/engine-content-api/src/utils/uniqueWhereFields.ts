import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'

export const getFieldsForUniqueWhere = (schema: Model.Schema, entity: Model.Entity): string[][] => {
	const relations = Object.values(
		acceptEveryFieldVisitor<undefined | [string]>(schema, entity, {
			visitColumn: () => undefined,
			visitManyHasManyInverse: () => undefined,
			visitManyHasManyOwner: () => undefined,
			visitOneHasMany: ({}, relation) => [relation.name],
			visitManyHasOne: () => undefined,
			visitOneHasOneInverse: ({}, relation) => [relation.name],
			visitOneHasOneOwner: ({}, relation) => [relation.name],
		}),
	).filter((it): it is [string] => !!it)

	return [[entity.primary], ...Object.values(entity.unique).map(it => it.fields), ...relations]
}
