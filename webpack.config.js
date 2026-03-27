import path from "path";
import webpack from "webpack";

export default {
    mode: "production",
    entry: "./index.ts",
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
                test: /\.(woff2?|ttf|otf|eot)$/i,
                type: "asset/inline"
            },
            {
                test: /\.ts$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        transpileOnly: true
                    }
                },
                exclude: /node_modules/
            },
            {
                test: /\.yml$/,
                use: "yaml-loader"
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.less$/,
                use: ["style-loader", "css-loader", "less-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js", ".yml"]
    },
    plugins: [new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })]
};
