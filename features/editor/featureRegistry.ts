export type FeatureInstaller = () => void;

const installedFeatures = new WeakSet<FeatureInstaller>();

export function installFeatures(installers: FeatureInstaller[]): void {
    installers.forEach(installFeature => {
        if (installedFeatures.has(installFeature)) return;
        installFeature();
        installedFeatures.add(installFeature);
    });
}
