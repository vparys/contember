import { createAction } from 'redux-actions'
import { getTenantErrorMessage } from '../apiClient'
import { SET_ERROR, SET_IDENTITY, SET_LOADING, SET_LOGOUT } from '../reducer/auth'
import { pushRequest } from './request'
import { ActionCreator, Dispatch } from './types'
import AuthState, { AuthIdentity, Project } from '../state/auth'
import { invokeIfSupportsCredentials } from '../utils/invokeIfSupportsCredentials'

export const login = (email: string, password: string, rememberMe: boolean): ActionCreator => async (
	dispatch,
	getState,
	services,
) => {
	dispatch(createAction(SET_LOADING)())
	try {
		const { signIn } = await services.tenantClient.request(
			loginMutation,
			{
				email,
				password,
				expiration: rememberMe ? 3600 * 24 * 14 : undefined,
			},
			services.config.loginToken,
		)
		if (signIn.ok) {
			await invokeIfSupportsCredentials(async () => {
				const credentials = await navigator.credentials.create({
					password: {
						password,
						id: email,
					},
				})
				if (credentials) {
					await navigator.credentials.store(credentials)
				}
			})
			dispatch(
				createAction<AuthIdentity>(SET_IDENTITY, () => ({
					token: signIn.result.token,
					email: signIn.result.person.email,
					personId: signIn.result.person.id,
					projects: signIn.result.person.identity.projects.map(
						(it: any): Project => ({
							slug: it.project.slug,
							roles: it.memberships.map((membership: { role: string }) => membership.role),
						}),
					),
				}))(),
			)
			return dispatch(pushRequest(() => ({ name: 'projects_list' })))
		} else {
			return dispatch(
				createAction(SET_ERROR, () =>
					signIn.errors.map((err: any) => err.endUserMessage || getTenantErrorMessage(err.code)).join(', '),
				)(),
			)
		}
	} catch (error) {
		console.error(error.message)
		return dispatch(createAction(SET_ERROR, () => 'Something went wrong')())
	}
}

export const tryAutoLogin = (): ActionCreator => async (dispatch): Promise<any> => {
	await invokeIfSupportsCredentials(async () => {
		const credentials = await navigator.credentials.get({
			password: true,
			mediation: 'silent',
		})
		if (credentials instanceof PasswordCredential && credentials.password) {
			dispatch(login(credentials.id, credentials.password, false))
		}
	})
}

const loginMutation = `
	mutation($email: String!, $password: String!, $expiration: Int) {
		signIn(email: $email, password: $password, expiration: $expiration) {
			ok
			errors {
				endUserMessage
				code
			}
			result {
				token
				person {
					id
					email
					identity {
						projects {
							project {
								id
								slug
							}
							memberships {
								role
							}
						}
					}
				}
			}
		}
	}
`

export const logout = () => (dispatch: Dispatch) => {
	dispatch(createAction(SET_LOGOUT)())
	return dispatch(pushRequest(() => ({ name: 'login' })))
}
