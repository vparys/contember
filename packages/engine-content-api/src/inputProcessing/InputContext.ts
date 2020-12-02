import { Input, Model } from '@contember/schema'

export interface ColumnContext {
	entity: Model.Entity
	column: Model.AnyColumn
	input: Input.ColumnValue | undefined
}

export interface ManyHasManyInverseContext {
	entity: Model.Entity
	relation: Model.ManyHasManyInverseRelation
	targetEntity: Model.Entity
	targetRelation: Model.ManyHasManyOwnerRelation
}

export interface ManyHasManyOwnerContext {
	entity: Model.Entity
	relation: Model.ManyHasManyOwnerRelation
	targetEntity: Model.Entity
	targetRelation: Model.ManyHasManyInverseRelation | null
}

export interface ManyHasOneContext {
	entity: Model.Entity
	relation: Model.ManyHasOneRelation
	targetEntity: Model.Entity
	targetRelation: Model.OneHasManyRelation | null
}

export interface OneHasManyContext {
	entity: Model.Entity
	relation: Model.OneHasManyRelation
	targetEntity: Model.Entity
	targetRelation: Model.ManyHasOneRelation
}

export interface OneHasOneInverseContext {
	entity: Model.Entity
	relation: Model.OneHasOneInverseRelation
	targetEntity: Model.Entity
	targetRelation: Model.OneHasOneOwnerRelation
}

export interface OneHasOneOwnerContext {
	entity: Model.Entity
	relation: Model.OneHasOneOwnerRelation
	targetEntity: Model.Entity
	targetRelation: Model.OneHasOneInverseRelation | null
}
