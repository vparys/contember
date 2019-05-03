import Permissions from '../../../core/authorization/Permissions'
import Identity from '../../../common/auth/Identity'
import Actions from './Actions'

class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(Identity.SystemRole.SUPER_ADMIN, Permissions.ALL, Permissions.ALL)
		permissions.allow(Identity.SystemRole.LOGIN, ...Actions.PERSON_SIGN_IN)
		permissions.allow(Identity.SystemRole.SETUP, ...Actions.SYSTEM_SETUP)
		permissions.allow(Identity.SystemRole.SELF, ...Actions.PERSON_CHANGE_PASSWORD)

		return permissions
	}
}

export default PermissionsFactory
