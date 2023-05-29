# SAPUI5 Initial Config

## Description
This extension provides commands to facilitate the initial configuration of SAPUI5 projects in Visual Studio Code. It offers the following commands: "SAPUI5 Initial Config", "SAPUI5 Create View", "SAPUI5 Translate i18n", and "SAPUI5 Find Missing i18n Declarations".

## Requirements
Make sure you have Visual Studio Code installed on your computer.

## Installation
1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the square icon in the sidebar or pressing `Ctrl+Shift+X`.
3. Search for "SAPUI5 Initial Config" in the Extensions marketplace.
4. Click the "Install" button for the "SAPUI5 Initial Config" extension by João Mota.
5. Wait for the installation to complete.

## Usage

### SAPUI5 Initial Config
This command adds the default configuration files to the SAPUI5 project.

1. Open the "index.html" file of the SAPUI5 project in the text editor.
2. Make sure the "index.html" file is located in the project's root directory.
3. Press `Ctrl + Shift + P` to open the command palette.
4. Type "SAPUI5 Initial Config" and select the corresponding option from the command palette results.
5. Follow the prompts and wait for the extension to complete the initial configuration.

### SAPUI5 Create View
This command creates a new view in the SAPUI5 project.

1. Open the "index.html" file of the SAPUI5 project in the text editor.
2. Make sure the "index.html" file is located in the project's root directory.
3. Press `Ctrl + Shift + P` to open the command palette.
4. Type "SAPUI5 Create View" and select the corresponding option from the command palette results.
5. Enter the desired name for the new view when prompted.
6. Wait for the extension to create the new view files and configure the application accordingly.

### SAPUI5 Translate i18n
This command allows you to automatically translate the text in an i18n (internationalization) properties file using an online translation service.

1. Open the "index.html" file of the SAPUI5 project in the text editor.
2. Make sure you have the i18n properties files in your project. By convention, they are usually named `i18n_<language>.properties` and located in the `i18n` directory.
3. Open the i18n properties file that you want to translate.
4. Press `Ctrl + Shift + P` to open the command palette.
5. Type "SAPUI5 Translate i18n" and select the corresponding option from the command palette results.
6. Follow the prompts to enter the target language for translation and the i18n file to translate from.
7. The extension will automatically translate the text in the i18n file using an online translation service.
8. The translated content will be saved to a new i18n file with the target language (e.g., `i18n_<targetLanguage>.properties`).
9. Review and make any necessary adjustments to the translated content.

### SAPUI5 Find Missing i18n Declarations
This command helps you identify words or keys used in your SAPUI5 application that are not declared in the i18n (internationalization) properties file.

1. Open the "index.html" file of the SAPUI5 project in the text editor.
2. Make sure you have the i18n properties file in your project. By convention, it's usually named `i18n.properties` and located in the `i18n` directory.
3. Press `Ctrl + Shift + P` to open the command palette.
4. Type "SAPUI5 Find Missing i18n Declarations" and select the corresponding option from the command palette results.
5. The extension will analyze your project files and compare the words used in the application with the keys declared in the i18n properties file.
6. A list of words that are used but not declared in the i18n file will be added to the `i18n.properties` file.

## Contribution
Contributions to this project are welcome! If you have any suggestions, issues, or corrections, feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/example/sapui5-initial-config).

## Developer
This project was developed by [João Mota](https://www.linkedin.com/in/joão-mota-730025231).

## License
This project is licensed under the MIT License. You can find more information in the [LICENSE](https://github.com/example/sapui5-initial-config/blob/main/LICENSE) file.
