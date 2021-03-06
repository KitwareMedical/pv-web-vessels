import * as Glance from 'paraview-glance';

import itkExtensionToIO from 'itk/extensionToIO';

import Controls from './controls';
import Rpc from './Rpc';
import SegmentTubeApi from './api/SegmentTube';
import {
  getBackendHostAndPort,
  getCommandLineArgs,
  openAsFile,
} from './ElectronUtils';
import { ReactPropsHOC } from './helpers/ReactPropsHOC';

import vtkITKImageReader from './helpers/ITKImageReader';

const { ElectronFileLoader, SegmentTubeEditor } = Controls;

function registerITKReader() {
  // ReaderFactory will lowercase all input filenames, so remove duplicate
  // extensions here.
  new Set(
    Object.keys(itkExtensionToIO).map((ext) => ext.toLowerCase())
  ).forEach((extension) =>
    Glance.registerReader({
      extension,
      name: `${extension.toUpperCase()} Reader`,
      vtkReader: vtkITKImageReader,
      readMethod: 'readAsArrayBuffer',
      parseMethod: 'parseAsArrayBuffer',
      fileNameMethod: 'setFileName',
    })
  );
}

function main(mountPoint) {
  const [backendHost, backendPort] = getBackendHostAndPort();
  const rpc = new Rpc(SegmentTubeApi, {
    application: 'SegmentTubes',
    host: backendHost,
    port: backendPort,
  });
  rpc.connect();

  registerITKReader();

  const initialFiles = getCommandLineArgs().map((file) => openAsFile(file));

  const FileLoader = ReactPropsHOC(ElectronFileLoader, { initialFiles });
  const SegmentEditor = ReactPropsHOC(SegmentTubeEditor, {
    rpcClient: rpc.getClient(),
  });

  // overwrite the existing FileLoader
  Glance.registerControlTab('files', FileLoader, 5, 'file-alt', true);
  Glance.registerControlTab('tubes', SegmentEditor, 0, 'code-branch', true);

  Glance.createViewer(mountPoint);
}

main(document.querySelector('.root-container'));
