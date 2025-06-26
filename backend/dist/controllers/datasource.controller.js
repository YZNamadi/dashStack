"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDatasourceQuery = exports.getDatasources = exports.createDatasource = void 0;
const promise_1 = require("mysql2/promise");
const pg_1 = require("pg");
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const createDatasource = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { type, config } = req.body;
    try {
        const datasource = yield prisma_1.default.datasource.create({
            data: {
                projectId,
                type,
                config,
            },
        });
        res.status(201).json(datasource);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating datasource', error });
    }
});
exports.createDatasource = createDatasource;
const getDatasources = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    try {
        const datasources = yield prisma_1.default.datasource.findMany({
            where: { projectId },
        });
        res.json(datasources);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching datasources', error });
    }
});
exports.getDatasources = getDatasources;
const runDatasourceQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { datasourceId } = req.params;
    const { query, method = 'GET', body, headers = {} } = req.body;
    try {
        const datasource = yield prisma_1.default.datasource.findUnique({ where: { id: datasourceId } });
        if (!datasource) {
            res.status(404).json({ message: 'Datasource not found' });
            return;
        }
        let result;
        switch (datasource.type) {
            case 'MySQL':
                const mysqlConfig = datasource.config;
                const mysqlConnection = yield (0, promise_1.createConnection)(mysqlConfig.connectionString);
                const [mysqlRows] = yield mysqlConnection.execute(query);
                yield mysqlConnection.end();
                result = mysqlRows;
                break;
            case 'PostgreSQL':
                const pgConfig = datasource.config;
                const pgClient = new pg_1.Client({ connectionString: pgConfig.connectionString });
                yield pgClient.connect();
                const pgResult = yield pgClient.query(query);
                yield pgClient.end();
                result = pgResult.rows;
                break;
            case 'REST':
                const restConfig = datasource.config;
                const requestConfig = Object.assign({ method: method.toUpperCase(), url: `${restConfig.baseUrl}${query}`, headers: Object.assign(Object.assign(Object.assign({}, restConfig.defaultHeaders), restConfig.authHeaders), headers) }, (body && { data: body }));
                const response = yield (0, axios_1.default)(requestConfig);
                result = response.data;
                break;
            case 'Python':
            case 'JS':
                // For Python/JS datasources, we'll use the workflow engine
                res.status(501).json({ message: 'Python/JS datasources not yet implemented' });
                return;
            default:
                res.status(400).json({ message: `Unsupported datasource type: ${datasource.type}` });
                return;
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Error running query', error: error.message });
    }
});
exports.runDatasourceQuery = runDatasourceQuery;
