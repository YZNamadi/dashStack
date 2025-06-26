"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const datasource_routes_1 = __importDefault(require("./routes/datasource.routes"));
const page_routes_1 = __importDefault(require("./routes/page.routes"));
const workflow_routes_1 = __importDefault(require("./routes/workflow.routes"));
app.get('/', (req, res) => {
    res.send('Hello from DashStack!');
});
app.use('/auth', auth_routes_1.default);
app.use('/projects', project_routes_1.default);
app.use('/projects/:projectId/datasources', datasource_routes_1.default);
app.use('/projects/:projectId/pages', page_routes_1.default);
app.use('/projects/:projectId/workflows', workflow_routes_1.default);
exports.default = app;
