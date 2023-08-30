import { CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { PersonQuery, PersonRow } from '../queries'
import { SignUpErrorCode } from '../../schema'
import { TenantRole } from '../authorization'
import { getPasswordWeaknessMessage } from '../utils/password'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'
import { MaybePassword } from '../dtos'
import { validateEmail } from '../utils/email'

type SignUpUser = {
	email: string
	name?: string
	password: MaybePassword
	roles?: readonly string[]
}

export class SignUpManager {
	async signUp(dbContext: DatabaseContext, { email, password, roles = [] }: SignUpUser): Promise<SignUpResponse> {
		if (!validateEmail(email.trim())) {
			return new ResponseError('INVALID_EMAIL_FORMAT', 'E-mail address is not in a valid format')
		}
		if (await this.isEmailAlreadyUsed(dbContext, email)) {
			return new ResponseError('EMAIL_ALREADY_EXISTS', `User with email ${email} already exists`)
		}
		const plainPassword = password.getPlain()
		const weakPassword = plainPassword ? getPasswordWeaknessMessage(plainPassword) : null
		if (weakPassword) {
			return new ResponseError('TOO_WEAK', weakPassword)
		}
		const person = await dbContext.transaction(async db => {
			const identityId = await db.commandBus.execute(new CreateIdentityCommand([...roles, TenantRole.PERSON]))
			return await db.commandBus.execute(new CreatePersonCommand({ identityId, email, password }))
		})
		return new ResponseOk(new SignUpResult(person))
	}

	private async isEmailAlreadyUsed(dbContext: DatabaseContext, email: string): Promise<boolean> {
		const personOrNull = await dbContext.queryHandler.fetch(PersonQuery.byEmail(email))
		return personOrNull !== null
	}
}

export class SignUpResult {
	constructor(public readonly person: Omit<PersonRow, 'roles'>) {}
}
export type SignUpResponse = Response<SignUpResult, SignUpErrorCode>
