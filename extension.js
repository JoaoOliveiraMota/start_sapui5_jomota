// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const axios = require('axios').default;


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "initial-config-sapui5" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	function checkProjectDirectory() {
		// Obtenha o diretório atual
		const activeEditor = vscode.window.activeTextEditor;
		const currentFile = activeEditor.document.uri.fsPath;

		function getWebappPath(fullPath) {
			const parts = fullPath.split(path.sep);
			const webappIndex = parts.indexOf('webapp');
			if (webappIndex !== -1) {
				return path.join(...parts.slice(0, webappIndex + 1));
			}
			throw new Error('Webapp folder not found...');
		}

		const webappPath = getWebappPath(currentFile);
		return webappPath;
	}

	let disposable = vscode.commands.registerCommand('initial-config-sapui5.initialConfigSAPUI5', function () {
		const activeEditor = vscode.window.activeTextEditor;

		var webappPath = checkProjectDirectory();

		if (activeEditor) {
			try {
				// Obtém o caminho completo do arquivo do editor de texto ativo
				// const currentFile = activeEditor.document.uri.fsPath;
				// Obtém a pasta da extensão para ir buscar os resources
				const extensionPath = context.extensionPath;

				// const modelsPath = path.join(path.dirname(currentFile), 'model', 'models.js');
				const modelsPath = path.join(webappPath, 'model', 'models.js');
				if (fs.existsSync(modelsPath)) {
					const newContent = `sap.ui.define([
							"sap/ui/model/json/JSONModel",
							"sap/ui/Device"
						], 
							/**
							 * provide app-view type models (as in the first "V" in MVVC)
							 * 
							 * @param {typeof sap.ui.model.json.JSONModel} JSONModel
							 * @param {typeof sap.ui.Device} Device
							 * 
							 * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
							 */
							function (JSONModel, Device) {
								"use strict";
						
								return {
									createDeviceModel: function () {
										var oModel = new JSONModel(Device);
										oModel.setDefaultBindingMode("OneWay");
										return oModel;
									},
						
									createGlobalModel: function () {
										var oModel = new JSONModel({
											Refresh: false
										});
										return oModel;
									}
								};
							});
						`;

					fs.writeFileSync(modelsPath, newContent, 'utf8');
				}

				//COMPONENT
				const componentPath = path.join(webappPath, 'Component.js');
				if (fs.existsSync(componentPath)) {
					// Obter o ID do projeto a partir do nome do arquivo
					const componentContent = fs.readFileSync(componentPath, 'utf-8');

					// Encontra a palavra após .Component
					const regex = /return UIComponent.extend\("(.*)\.Component"/;
					const matches = componentContent.match(regex);
					const componentName = matches ? matches[1] : '';

					const newComponentContent = `sap.ui.define([
											"sap/ui/core/UIComponent",
											"sap/ui/Device",
											"${componentName}/model/models",
											"./controller/ErrorHandler"
										],
										function (UIComponent, Device, models, ErrorHandler) {
											"use strict";

											return UIComponent.extend("${componentName}.Component", {
											metadata: {
												manifest: "json"
											},

											init: function () {
												UIComponent.prototype.init.apply(this, arguments);

												this._oErrorHandler = new ErrorHandler(this);

												this.getRouter().initialize();
												this.setModel(models.createDeviceModel(), "device");
												this.setModel(models.createGlobalModel(), "global");
												// jQuery.sap.includeStyleSheet("css/style.css");
											},

											destroy: function () {
												this._oErrorHandler.destroy();
												UIComponent.prototype.destroy.apply(this, arguments);
											}
											});
										});
										`;

					// Escrever o novo conteúdo no arquivo Component.js
					fs.writeFileSync(componentPath, newComponentContent, 'utf-8');
					console.log('Component.js file updated successfully!');

					const errorHandlerPath = path.join(webappPath, 'controller', 'ErrorHandler.js');
					if (!fs.existsSync(errorHandlerPath)) {
						const errorHandlerContent = `sap.ui.define([
							"sap/ui/base/Object",
							"sap/m/MessageBox",
							"sap/ui/model/Filter",
							"sap/ui/model/FilterOperator"
						], function (UI5Object, MessageBox, Filter, FilterOperator) {
							"use strict";
						
							return UI5Object.extend("${componentName}.controller.ErrorHandler", {
								constructor : function (oComponent) {
									var oMessageManager = sap.ui.getCore().getMessageManager(),
										oMessageModel = oMessageManager.getMessageModel(),
										oResourceBundle = oComponent.getModel("i18n").getResourceBundle(),
										sErrorText = oResourceBundle.getText("errorText"),
										sMultipleErrors = oResourceBundle.getText("multipleErrorsText");
						
									this._oComponent = oComponent;
									this._bMessageOpen = false;
						
									this.oMessageModelBinding = oMessageModel.bindList("/", undefined,
										[], new Filter("technical", FilterOperator.EQ, true));
						
									this.oMessageModelBinding.attachChange(function (oEvent) {
										var aContexts = oEvent.getSource().getContexts(),
											aMessages = [],
											sErrorTitle;
						
										if (this._bMessageOpen || !aContexts.length) {
											return;
										}
						
										aContexts.forEach(function (oContext) {
											aMessages.push(oContext.getObject());
										});
										oMessageManager.removeMessages(aMessages);
						
										sErrorTitle = aMessages.length === 1 ? sErrorText : sMultipleErrors;
										this._showServiceError(sErrorTitle, aMessages[0].message);
									}, this);
								},
								
								_showServiceError : function (sErrorTitle, sDetails) {
									this._bMessageOpen = true;
									MessageBox.error(
										sErrorTitle,
										{
											id : "serviceErrorMessageBox",
											details: sDetails,
											styleClass: this._oComponent.getContentDensityClass(),
											actions: [MessageBox.Action.CLOSE],
											onClose: function () {
												this._bMessageOpen = false;
											}.bind(this)
										}
									);
								}
							});
						});
						`;

						// Escrever o conteúdo no arquivo ErrorHandler.js
						fs.writeFileSync(errorHandlerPath, errorHandlerContent, 'utf-8');

						console.log('ErrorHandler.js file created successfully!');
					}
				}
				//COMPONENT

				//COMPONENT-PRELOAD.js
				const componentPreloadPath = path.join(webappPath, 'Component-preload.js');
				if (!fs.existsSync(componentPreloadPath)) {
					fs.writeFileSync(componentPreloadPath, '');
					console.log('Component-preload.js file created successfully!');
				}
				//COMPONENT-PRELOAD.js

				// FULL WIDTH NO MANIFEST && app view

				// const appViewPath = path.join(path.dirname(currentFile), 'view', 'App.view.xml');
				const appViewPath = path.join(webappPath, 'view', 'App.view.xml');
				const appViewContent = fs.readFileSync(appViewPath, 'utf-8');

				// Use uma expressão regular para substituir o conteúdo dentro do elemento <mvc:View>
				// eslint-disable-next-line no-unused-vars
				const updatedAppViewContent = appViewContent.replace(/<mvc:View([^>]*)>([\s\S]*?)<\/mvc:View>/i, (match, attributes, oldContent) => {
					// Substitua oldContent pelo novo conteúdo desejado
					const newContent = `
					<Shell id="shell" appWidthLimited="false">
					  <App id="app" busy="{global>/busy}">
						<!-- Novo conteúdo aqui -->
					  </App>
					</Shell>
				  `;

					// Retorne o elemento <mvc:View> atualizado
					return `<mvc:View${attributes}>${newContent}</mvc:View>`;
				});

				// Salva as alterações no arquivo "App.view.xml"
				fs.writeFileSync(appViewPath, updatedAppViewContent, 'utf-8');

				console.log('<mvc:View> element content updated successfully!');



				const manifestPath = path.join(webappPath, 'manifest.json');
				const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
				const manifestJson = JSON.parse(manifestContent);

				// Verifica se o objeto "sap.ui" existe no manifesto
				if (!manifestJson['sap.ui']) {
					manifestJson['sap.ui'] = {};
				}

				// Adiciona o campo "fullWidth" no objeto "sap.ui"
				manifestJson['sap.ui'].fullWidth = true;

				// Salva as alterações no manifesto
				fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 4));

				console.log('"fullWidth" field successfully added to the manifest!');

				// FULL WIDTH NO MANIFEST

				//PACKAGE.JSON CONFIG PACKAGE.JSON CONFIG PACKAGE.JSON CONFIG
				// Obtém o package.json para alterar o start build etc
				const mainPath = path.dirname(webappPath);

				const pkjsonPath = path.join(mainPath, 'package.json');

				if (fs.existsSync(pkjsonPath)) {
					const packageJson = require(pkjsonPath);

					const originalStartScript = packageJson.scripts.start;
					const sapClientRegex = /sap-client=(\d+)/;
					const originalSapClientMatch = originalStartScript.match(sapClientRegex);
					const originalSapClient = originalSapClientMatch ? originalSapClientMatch[1] : '';

					// Substitua todos os scripts existentes pelos novos scripts desejados
					packageJson.scripts = {
						start: `fiori run --open "index.html?sap-client=${originalSapClient}&sap-ui-xx-viewCache=false"`,
						build: 'ui5 build --config=ui5.yaml --clean-dest --dest dist',
						deploy: 'npm run build && fiori deploy --config ui5-deploy.yaml && rimraf archive.zip',
						'deploy-config': 'fiori add deploy-config'
					};

					// Escreva as alterações no arquivo package.json
					fs.writeFileSync(pkjsonPath, JSON.stringify(packageJson, null, 2));

					console.log('package.json updated successfully!');
				} else {
					console.log('package.json file not found.');
				}
				//PACKAGE.JSON CONFIG PACKAGE.JSON CONFIG PACKAGE.JSON CONFIG

				//pasta Controller pasta Controller pasta Controller pasta Controller 
				const addController = path.join(webappPath, 'controller', 'BaseController.js');

				var ai18n = [
					'i18n_pt.properties', // Português (Portugal)
					'i18n_en.properties', // Inglês (Estados Unidos)
					'i18n_es.properties', // Espanhol (Espanha)
					'i18n_fr.properties', // Francês (França)
					'i18n_de.properties', // Alemão (Alemanha)
					'i18n_it.properties', // Italiano (Itália)
					'i18n_ru.properties', // Russo (Rússia)
				];

				var aSelectedi18n = [];

				vscode.window.showQuickPick(ai18n, {
					placeHolder: 'Select the files you want to add',
					canPickMany: true
				}).then(selection => {
					if (!selection) {
						return;
					}

					const aSelectedi18n = selection;  // Mova a declaração de aSelectedi18n para aqui
					const selectedFiles = selection.join(', ');
					vscode.window.showInformationMessage('You selected: ' + selectedFiles);

					// Mova o loop for para dentro do bloco .then
					for (let i = 0; i < aSelectedi18n.length; i++) {
						const element = aSelectedi18n[i];
						const addi18n = path.join(webappPath, 'i18n', element);

						if (!fs.existsSync(addi18n)) {
							const i18nContent = 'errorText=Error Text \n multipleErrorsText=Multiple Errors Text';
							fs.writeFileSync(addi18n, i18nContent);
						}
					}
				});


				const addFormatter = path.join(webappPath, 'model', 'formatter.js');

				if (fs.existsSync(addFormatter)) {
					vscode.window.showInformationMessage("The project is already prepared!", 'Thanks');
				} else {
					const formatterPath = path.join(extensionPath, 'resources', 'formatter.txt');
					const formatterContent = fs.readFileSync(formatterPath, 'utf-8');
					fs.writeFileSync(addFormatter, formatterContent);
				}

				if (fs.existsSync(addController)) {
					vscode.window.showInformationMessage("The project is already prepared!", 'Thanks');
				} else {

					const basePath = path.join(extensionPath, 'resources', 'BaseController.txt');
					const baseContent = fs.readFileSync(basePath, 'utf-8');
					// const fileContent = baseContent;
					const indexPath = path.join(webappPath, 'index.html');
					const indexContent = fs.readFileSync(indexPath, 'utf-8');
					const regex = /data-settings='{"id"\s*:\s*"([^"]+)"/;
					const matches = indexContent.match(regex);
					const projectName = matches[1];

					const fileContent = baseContent.replace(/zcappmasterdata\.controller\.BaseController/g, `${projectName}.controller.BaseController`);
					fs.writeFileSync(addController, fileContent);

					vscode.window.showInformationMessage('BaseController.js Added');


					const mainController = path.join(webappPath, 'controller', 'Main.controller.js');
					if (fs.existsSync(mainController)) {
						const mainFileContent = fs.readFileSync(mainController, 'utf-8');

						if (mainFileContent.includes('sap.ui.define')) {
							let editedFileContent = mainFileContent.replace(
								'sap.ui.define([',
								'sap.ui.define([\n    "./BaseController",'
							);
							editedFileContent = editedFileContent.replace(
								/function\s*\(\s*Controller\s*\)/g,
								'function(BaseController)'
							);
							editedFileContent = editedFileContent.replace(
								/return\s+Controller\.extend/g,
								'return BaseController.extend'
							);
							fs.writeFileSync(mainController, editedFileContent);
							// vscode.window.showInformationMessage('Main Controller modificado com sucesso.');
							vscode.window.showInformationMessage("The project is already prepared!", 'Thanks');
						}
					}

					const AppController = path.join(webappPath, 'controller', 'App.controller.js');
					if (fs.existsSync(AppController)) {
						const AppFileContent = fs.readFileSync(AppController, 'utf-8');

						if (AppFileContent.includes('sap.ui.define')) {
							let editedFileContentA = AppFileContent.replace(
								/sap.ui.define\(\[/g,
								'sap.ui.define([\n    "./BaseController",'
							);
							editedFileContentA = editedFileContentA.replace(
								/function\s*\(\s*Controller\s*\)/g,
								'function(BaseController)'
							);
							editedFileContentA = editedFileContentA.replace(
								/return\s+Controller\.extend/g,
								'return BaseController.extend'
							);
							fs.writeFileSync(AppController, editedFileContentA);
							vscode.window.showInformationMessage("The project is already prepared!", 'Thanks');
						}
					}


				}

			} catch (error) {
				vscode.window.showInformationMessage('Error, unable to run the command');
			}
			// Exibe o caminho completo do diretório
			// vscode.window.showInformationMessage('Current directory: ' + currentDirectory);
		} else {
			vscode.window.showInformationMessage('No active text editor.');
		}
	});

	let createView = vscode.commands.registerCommand('initial-config-sapui5.createView', async function () {
		const activeEditor = vscode.window.activeTextEditor;

		if (activeEditor) {
			try {
				// Solicita ao usuário o nome da view
				const viewName = await vscode.window.showInputBox({
					title: 'New View',
					prompt: 'Enter the name of the new view (without the extension)',
					placeHolder: 'View name',
					validateInput: (value) => {
						if (!value) {
							return 'View name cannot be empty';
						}
						return null;
					},
				});

				if (!viewName) {
					return; // O usuário cancelou a operação
				}

				var webappPath = checkProjectDirectory();

				// const ctFile = activeEditor.document.uri.fsPath;
				const cDirectory = webappPath;
				const projectName = path.basename(path.dirname(cDirectory));

				// Cria a nova view
				const viewPath = path.join(cDirectory, 'view', `${viewName}.view.xml`);
				const viewContent = `<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" controllerName="${projectName}.controller.${viewName}"> \n\n</mvc:View>`;
				fs.writeFileSync(viewPath, viewContent);

				const controllerPath = path.join(cDirectory, 'controller', `${viewName}.controller.js`);
				// const controllerContent = `sap.ui.define([ \n    "./BaseController" \n], function (BaseController) { \n    "use strict"; \n\n    return BaseController.extend("${viewName}.controller", { \n        // Controller code \n    }); \n});`;
				const controllerContent = `sap.ui.define([
					"./BaseController",
					"sap/ui/model/json/JSONModel"
				], function (BaseController, JSONModel) {
					"use strict";
				
					return BaseController.extend("${projectName}.controller.${viewName}", {
						onInit: function () {
							// Create and set the JSON model
							var oModel = new JSONModel();
							this.getView().setModel(oModel, "${viewName}");
				
							// Your onInit code here
						},
				
						// Other controller methods here
					});
				});
				`;
				fs.writeFileSync(controllerPath, controllerContent);

				const manifestPath = path.join(cDirectory, 'manifest.json');
				const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
				const manifestJson = JSON.parse(manifestContent);



				// Adiciona uma nova rota no objeto 'sap.ui5.routing.routes'
				if (!manifestJson['sap.ui5'].routing.routes) {
					manifestJson['sap.ui5'].routing.routes = [];
				}
				manifestJson['sap.ui5'].routing.routes.push({
					name: viewName,
					pattern: viewName,
					target: viewName,
				});

				// Adiciona o novo target no objeto 'sap.ui5.routing.targets'
				if (!manifestJson['sap.ui5'].routing.targets) {
					manifestJson['sap.ui5'].routing.targets = {};
				}
				manifestJson['sap.ui5'].routing.targets[viewName] = {
					viewName: `${viewName}`,
					viewType: 'XML',
					transition: 'slide',
					clearControlAggregation: false,
					viewId: `${viewName}`,
				};

				// Salva as alterações no manifesto
				fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 4));

			} catch (error) {

			}

		}

	});

	let translatei18n = vscode.commands.registerCommand('initial-config-sapui5.translatei18n', async function () {
		const activeEditor = vscode.window.activeTextEditor;

		if (activeEditor) {
			// var confirmExits = false;
			// const ctFile = activeEditor.document.uri.fsPath;
			//WEBAPP
			var webappPath = checkProjectDirectory();
			const projectName = webappPath;
			const i18nTarget = await vscode.window.showInputBox({
				title: 'i18n to fill',
				prompt: 'Enter the i18n name to translate (ex: i18n)',
				placeHolder: 'i18n to fill',
				validateInput: (value) => {
					if (!value) {
						return 'i18n error';
					}
					return null;
				},
			});

			if (!i18nTarget) {
				return; // O usuário cancelou a operação
			}
			// const finali18nTarget = path.join(projectName, "i18n", i18nTarget + ".properties");
			const pathi18nEdit = path.join(projectName, "i18n", i18nTarget + ".properties");
			if (!fs.existsSync(pathi18nEdit)) {
				vscode.window.showErrorMessage('The introduced i18n does not exist, run SAPUI5 ADD I18N\'S to generate.');
				return;
			}

			const i18nMain = await vscode.window.showInputBox({
				title: 'i18n to translate',
				prompt: 'Enter the name of the i18n to fill in (ex: i18n_pt_PT)',
				placeHolder: 'i18n to translate',
				validateInput: (value) => {
					if (!value) {
						return 'i18n error';
					}
					return null;
				},
			});

			const pathi18nMain = path.join(projectName, "i18n", i18nMain + ".properties");
			if (!fs.existsSync(pathi18nMain)) {
				vscode.window.showErrorMessage('The introduced i18n does not exist, run SAPUI5 ADD I18N\'S to generate.');
				return;
			}



			fs.readFile(pathi18nMain, 'utf8', async (err, data) => {
				if (err) {
					console.error('Error reading file:', err);
					return;
				}

				// Split the file contents into individual lines
				const lines = data.split('\n');

				// if(i18nTarget.indexOf('_'))
				const translateTo = (i18nTarget.indexOf('_') != -1 ? i18nTarget.split('_')[1] : 'en');
				const translateFrom = (i18nMain.indexOf('_') != -1 ? i18nMain.split('_')[1] : 'en');

				// Iterate over each line and translate the text before the '=' sign
				const translatedLines = await Promise.all(lines.map(async (line) => {
					const [key, value] = line.split('=');

					if (key && value) {
						try {
							// const translateFrom = 'en';
							// const translateTo = 'pt';
							const apiUrl = `https://api.mymemory.translated.net/get?q=${value}&langpair=${translateFrom}|${translateTo}`;
							const response = await axios.get(apiUrl);
							const data = response.data;
							const translation = data.responseData.translatedText;

							if (translation) {
								return `${key}=${translation}`;
							} else {
								return line;
							}
						} catch (error) {
							console.error('Translation error:', error);
							return line;
						}
					}

					return line;
				}));

				const translatedContent = translatedLines.join('\n');

				fs.writeFile(pathi18nEdit, translatedContent, 'utf8', (err) => {
					if (err) {
						console.error('Error writing file:', err);
						return;
					}

					console.log('Translation complete. File saved:', pathi18nEdit);
				});

			});


		}

	});

	let addI18nFiles = vscode.commands.registerCommand('initial-config-sapui5.addI18nFiles', async function () {
		var webappPath = checkProjectDirectory();

		var ai18n = [
			'i18n_pt.properties', // Português (Portugal)
			'i18n_en.properties', // Inglês (Estados Unidos)
			'i18n_es.properties', // Espanhol (Espanha)
			'i18n_fr.properties', // Francês (França)
			'i18n_de.properties', // Alemão (Alemanha)
			'i18n_it.properties', // Italiano (Itália)
			'i18n_ru.properties', // Russo (Rússia)
		];

		vscode.window.showQuickPick(ai18n, {
			placeHolder: 'Select the files you want to add',
			canPickMany: true
		}).then(selection => {
			if (!selection) {
				return;
			}

			const selectedFiles = selection.join(', ');
			vscode.window.showInformationMessage('You selected: ' + selectedFiles);

			for (let i = 0; i < selection.length; i++) {  // Use "selection" em vez de "aSelectedi18n"
				const element = selection[i];  // Use "selection" em vez de "aSelectedi18n"

				const addi18n = path.join(webappPath, 'i18n', element);

				if (!fs.existsSync(addi18n)) {
					const i18nContent = 'errorText=Error Text \n multipleErrorsText=Multiple Errors Text';
					fs.writeFileSync(addi18n, i18nContent);
				}
			}
		});
	});


	let getWordsNotDeclared = vscode.commands.registerCommand('initial-config-sapui5.getWordsNotDeclared', async function () {
		const activeEditor = vscode.window.activeTextEditor;

		if (activeEditor) {
			try {
				// Obtém o caminho completo do arquivo do editor de texto ativo
				// const currentFile = activeEditor.document.uri.fsPath;
				// Obtém a pasta da extensão para ir buscar os resources
				// const extensionPath = context.extensionPath;
				// Obtém o a pasta das views
				var webappPath = checkProjectDirectory();
				const viewsPath = path.join(webappPath, 'view');
				const files = fs.readdirSync(viewsPath);
				const i18nRegex = /{i18n>(\w+)}/g;
				const missingWords = [];

				files.forEach(file => {
					const filePath = path.join(viewsPath, file);
					const content = fs.readFileSync(filePath, 'utf8');
					const matches = content.matchAll(i18nRegex);
					for (const match of matches) {
						const word = match[1];
						missingWords.push(word);
					}
				});

				const i18nPath = path.join(webappPath, 'i18n', 'i18n.properties');
				const i18nContent = fs.readFileSync(i18nPath, 'utf8');

				const lines = i18nContent.split('\n');
				const wordsi18n = [];

				lines.forEach(line => {
					if (line.trim() !== '') {
						const [key] = line.split('=');
						const word = key.trim();
						wordsi18n.push(word);
					}
				});


				missingWords.forEach(word => {
					if (!wordsi18n.includes(word)) {
						const line = `${word} = ${word}`;
						lines.push(line);
						missingWords.push(word);
					}
				});

				const newContent = lines.join('\n');
				fs.writeFileSync(i18nPath, newContent, 'utf8');

				console.log('Words added in i18n.properties successfully!');

			} catch (error) {
				return;
			}
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(createView);
	context.subscriptions.push(translatei18n);
	context.subscriptions.push(getWordsNotDeclared);
	context.subscriptions.push(addI18nFiles);
	// context.subscriptions.push(insertConsoleLog);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
