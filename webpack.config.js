import path from "path";

export default {
    mode: "production",
    entry: "./index.js",
    output: {
        filename: "webhacker-editor.bundle.js",
        path: path.resolve("dist"),
        library: "WebHackerEditor",
        libraryTarget: "umd",
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.yml$/,
                use: "yaml-loader"
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".js", ".yml"]
    }
};
