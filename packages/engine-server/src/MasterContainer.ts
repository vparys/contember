import { SystemContainerFactory } from '@contember/engine-system-api'
import { TenantContainerFactory } from '@contember/engine-tenant-api'
import { Builder } from '@contember/dic'
import { Config } from './config/config'
import { createDbMetricsRegistrar, logSentryError, ProcessType } from './utils'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { Initializer } from './bootstrap'
import { Plugin } from '@contember/engine-plugins'
import { createColllectHttpMetricsMiddleware, createShowMetricsMiddleware } from './http'
import {
	ApiMiddlewareFactory,
	AuthMiddlewareFactory,
	compose,
	ContentServerMiddlewareFactory,
	createHomepageMiddleware,
	createPlaygroundMiddleware,
	createPoweredByHeaderMiddleware,
	createProviders,
	createTimerMiddleware,
	ErrorFactory,
	Koa,
	NotModifiedMiddlewareFactory,
	ProjectGroupMiddlewareFactory,
	ProjectMemberMiddlewareFactory,
	ProjectResolveMiddlewareFactory,
	Providers,
	route,
	StageResolveMiddlewareFactory, SystemGraphQLHandlerFactory,
	SystemGraphQLMiddlewareFactory, TenantGraphQLHandlerFactory,
	TenantGraphQLMiddlewareFactory,
} from '@contember/engine-http'
import prom from 'prom-client'
import { ProjectContainerFactoryFactory } from './project'
import { createSecretKey } from 'crypto'
import koaCompress from 'koa-compress'
import bodyParser from 'koa-bodyparser'
import { ProjectConfigResolver } from './config/projectConfigResolver'
import { TenantConfigResolver } from './config/tenantConfigResolver'
import { ProjectGroupContainerResolver } from './projectGroup/ProjectGroupContainerResolver'
import { ProjectGroupContainerFactory } from './projectGroup/ProjectGroupContainer'

export interface MasterContainer {
	initializer: Initializer
	koa: Koa
	monitoringKoa: Koa
	providers: Providers
}

export interface MasterContainerArgs {
	debugMode: boolean
	config: Config
	projectConfigResolver: ProjectConfigResolver
	tenantConfigResolver: TenantConfigResolver
	plugins: Plugin[]
	processType: ProcessType
	version?: string
}

export class MasterContainerFactory {
	createBuilder({
		config,
		debugMode,
		plugins,
		projectConfigResolver,
		tenantConfigResolver,
		processType,
		version,
	}: MasterContainerArgs) {
		return new Builder({})
			.addService('config', () =>
				config)
			.addService('debugMode', () =>
				debugMode)
			.addService('processType', () =>
				processType)
			.addService('version', () =>
				version)
			.addService('projectConfigResolver', () =>
				projectConfigResolver)
			.addService('tenantConfigResolver', () =>
				tenantConfigResolver)
			.addService('plugins', () =>
				plugins)
			.addService('providers', ({ config }) => {
				const encryptionKey = config.tenant.secrets.encryptionKey
					? createSecretKey(Buffer.from(config.tenant.secrets.encryptionKey, 'hex'))
					: undefined
				return createProviders({ encryptionKey })
			})
			.addService('tenantContainerFactory', ({ providers }) =>
				new TenantContainerFactory(providers))
			.addService('modificationHandlerFactory', () =>
				new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
			.addService('systemContainerFactory', ({ providers, modificationHandlerFactory }) =>
				new SystemContainerFactory(providers, modificationHandlerFactory))
			.addService('projectContainerFactoryFactory', ({ debugMode, plugins, providers }) =>
				new ProjectContainerFactoryFactory(debugMode, plugins, providers))
			.addService('tenantGraphQLHandlerFactory', () =>
				new TenantGraphQLHandlerFactory(logSentryError))
			.addService('systemGraphQLHandlerFactory', ({ debugMode }) =>
				new SystemGraphQLHandlerFactory(logSentryError, debugMode))
			.addService('projectGroupContainerFactory', ({ providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory }) =>
				new ProjectGroupContainerFactory(providers, systemContainerFactory, tenantContainerFactory, projectContainerFactoryFactory, projectConfigResolver, tenantGraphQLHandlerFactory, systemGraphQLHandlerFactory))
			.addService('projectGroupContainerResolver', ({ tenantConfigResolver, projectGroupContainerFactory }) =>
				new ProjectGroupContainerResolver(tenantConfigResolver, projectGroupContainerFactory))
			.addService('tenantGraphQlMiddlewareFactory', () =>
				new TenantGraphQLMiddlewareFactory())
			.addService('systemGraphQLMiddlewareFactory', () =>
				new SystemGraphQLMiddlewareFactory())
			.addService('promRegistry', ({ processType, projectGroupContainerResolver }) => {
				if (processType === ProcessType.clusterMaster) {
					const register = new prom.AggregatorRegistry()
					prom.collectDefaultMetrics({ register })
					return register
				}
				const register = prom.register
				prom.collectDefaultMetrics({ register })
				const registrar = createDbMetricsRegistrar(register)
				projectGroupContainerResolver.onCreate.push((groupContainer, slug) => {
					groupContainer.projectContainerResolver.onCreate.push(projectContainer =>
						registrar({
							connection: projectContainer.connection,
							labels: {
								contember_module: 'content',
								contember_project: projectContainer.project.slug,
								contember_project_group: slug ?? 'unknown',
							},
						}),
					)
					return registrar({
						connection: groupContainer.tenantContainer.connection,
						labels: {
							contember_module: 'tenant',
							contember_project_group: slug ?? 'unknown',
							contember_project: 'unknown',
						},
					})
				})
				return register
			})
			.addService('httpErrorFactory', ({ debugMode }) =>
				new ErrorFactory(debugMode))
			.addService('authMiddlewareFactory', ({ httpErrorFactory }) =>
				new AuthMiddlewareFactory(httpErrorFactory))
			.addService('projectGroupMiddlewareFactory', ({ projectGroupContainerResolver, httpErrorFactory }) =>
				new ProjectGroupMiddlewareFactory(config.server.projectGroup?.domainMapping, projectGroupContainerResolver, httpErrorFactory))
			.addService('projectResolverMiddlewareFactory', ({ httpErrorFactory }) =>
				new ProjectResolveMiddlewareFactory(httpErrorFactory))
			.addService('apiMiddlewareFactory', ({ projectGroupMiddlewareFactory, authMiddlewareFactory }) =>
				new ApiMiddlewareFactory(projectGroupMiddlewareFactory, authMiddlewareFactory))
			.addService('stageResolveMiddlewareFactory', ({ httpErrorFactory }) =>
				new StageResolveMiddlewareFactory(httpErrorFactory))
			.addService('notModifiedMiddlewareFactory', () =>
				new NotModifiedMiddlewareFactory())
			.addService('projectMemberMiddlewareFactory', ({ debugMode, httpErrorFactory }) =>
				new ProjectMemberMiddlewareFactory(debugMode, httpErrorFactory))
			.addService('contentServerMiddlewareFactory', () =>
				new ContentServerMiddlewareFactory())
			.addService(
				'koa',
				({
					 tenantGraphQlMiddlewareFactory,
					 systemGraphQLMiddlewareFactory,
					 apiMiddlewareFactory,
					 projectResolverMiddlewareFactory,
					 stageResolveMiddlewareFactory,
					 notModifiedMiddlewareFactory,
					 projectMemberMiddlewareFactory,
					 contentServerMiddlewareFactory,
					 promRegistry,
					 debugMode,
					 version,
					 config,
				 }) => {
					const app = new Koa()
					app.use(
						compose([
							koaCompress({
								br: false,
							}),
							bodyParser({
								jsonLimit: config.server.http.requestBodySize || '1mb',
							}),
							createPoweredByHeaderMiddleware(debugMode, version ?? 'unknown'),
							createColllectHttpMetricsMiddleware(promRegistry),
							createTimerMiddleware(),
							route('/playground$', createPlaygroundMiddleware()),
							createHomepageMiddleware(),
							route(
								'/content/:projectSlug/:stageSlug$',
								compose([
									apiMiddlewareFactory.create('content'),
									projectResolverMiddlewareFactory.create(),
									stageResolveMiddlewareFactory.create(),
									notModifiedMiddlewareFactory.create(),
									projectMemberMiddlewareFactory.create(),
									contentServerMiddlewareFactory.create(),
								]),
							),
							route(
								'/tenant$',
								compose([
									apiMiddlewareFactory.create('tenant'),
									tenantGraphQlMiddlewareFactory.create(),
								]),
							),
							route(
								'/system/:projectSlug$',
								compose([
									apiMiddlewareFactory.create('system'),
									projectResolverMiddlewareFactory.create(),
									projectMemberMiddlewareFactory.create(),
									systemGraphQLMiddlewareFactory.create(),
								]),
							),
						]),
					)

					return app
				},
			)
			.addService('monitoringKoa', ({ promRegistry }) => {
				const app = new Koa()
				app.use(createShowMetricsMiddleware(promRegistry))

				return app
			})
			.addService(
				'initializer',
				({ projectGroupContainerResolver }) =>
					new Initializer(projectGroupContainerResolver),
			)

	}

	create(args: MasterContainerArgs): MasterContainer {
		const container = this.createBuilder(args).build()
		return container.pick('initializer', 'koa', 'monitoringKoa', 'providers')
	}
}
