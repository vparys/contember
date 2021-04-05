import { Environment } from '../dao'
import { HasOneRelation } from '../treeParameters'
import { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import { PlaceholderGenerator } from './PlaceholderGenerator'

// This may also represent a reduced has many relation.
export class HasOneRelationMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly parameters: HasOneRelation,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		this.placeholderName = PlaceholderGenerator.getHasOneRelationPlaceholder(this.parameters)
	}

	public get isNonbearing() {
		return this.parameters.isNonbearing
	}
}
