import { gql } from 'apollo-server-koa'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		me: Identity!
	}

	type Mutation {
		setup(superadmin: AdminCredentials!): SetupResponse
		signUp(email: String!, password: String!): SignUpResponse
		signIn(email: String!, password: String!, expiration: Int): SignInResponse
		addProjectMember(projectId: String!, identityId: String!, roles: [String!]!): AddProjectMemberResponse
		updateProjectMemberVariables(
			projectId: String!
			identityId: String!
			variables: [VariableUpdate!]!
		): UpdateProjectMemberVariablesResponse
	}

	# === setUp ===

	input AdminCredentials {
		email: String!
		password: String!
	}

	type SetupResponse {
		ok: Boolean!
		errors: [SetupErrorCode!]!
		result: SetupResult
	}

	type SetupError {
		code: SetupErrorCode!
		endPersonMessage: String
		developerMessage: String
	}

	enum SetupErrorCode {
		SETUP_ALREADY_DONE
	}

	type SetupResult {
		superadmin: Person!
		loginKey: ApiKey!
	}

	# === signUp ===
	type SignUpResponse {
		ok: Boolean!
		errors: [SignUpError!]!
		result: SignUpResult
	}

	type SignUpError {
		code: SignUpErrorCode!
		endPersonMessage: String
		developerMessage: String
	}

	enum SignUpErrorCode {
		EMAIL_ALREADY_EXISTS
	}

	type SignUpResult {
		person: Person!
	}

	# === signIn ===
	type SignInResponse {
		ok: Boolean!
		errors: [SignInError!]!
		result: SignInResult
	}

	type SignInError {
		code: SignInErrorCode!
		endUserMessage: String
		developerMessage: String
	}

	enum SignInErrorCode {
		UNKNOWN_EMAIL
		INVALID_PASSWORD
	}

	type SignInResult {
		token: String!
		person: Person!
	}

	# === addProjectMember ===
	type AddProjectMemberResponse {
		ok: Boolean!
		errors: [AddProjectMemberError!]!
	}

	type AddProjectMemberError {
		code: AddProjectMemberErrorCode!
		endUserMessage: String
		developerMessage: String
	}

	enum AddProjectMemberErrorCode {
		PROJECT_NOT_FOUND
		IDENTITY_NOT_FOUND
		ALREADY_MEMBER
	}

	# === updateProjectMemberVariables ===

	input VariableUpdate {
		name: String!
		values: [String!]!
	}

	type UpdateProjectMemberVariablesResponse {
		ok: Boolean!
		errors: [UpdateProjectMemberVariablesError!]!
	}

	type UpdateProjectMemberVariablesError {
		code: UpdateProjectMemberVariablesErrorCode!
		endUserMessage: String
		developerMessage: String
	}

	enum UpdateProjectMemberVariablesErrorCode {
		PROJECT_NOT_FOUND
		IDENTITY_NOT_FOUND
		VARIABLE_NOT_FOUND
	}

	# === common ===
	type Person {
		id: String!
		email: String!
		identity: IdentityWithoutPerson!
	}

	type PersonWithoutIdentity {
		id: String!
		email: String!
	}

	type Identity {
		id: String!
		projects: [Project!]!
		person: PersonWithoutIdentity
	}

	type IdentityWithoutPerson {
		id: String!
		projects: [Project!]!
	}

	type Project {
		id: String!
		name: String!
		slug: String!
	}

	type ApiKey {
		id: String!
		token: String!
		identity: Identity!
	}
`

export default schema
