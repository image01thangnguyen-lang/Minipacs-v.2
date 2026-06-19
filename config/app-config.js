const urlParams = new URLSearchParams(window.location.search);
const patientName = urlParams.get('patientName');
if (patientName) {
  document.title = decodeURIComponent(patientName) + " | PACS Viewer";
}

window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  dataSources: [
    {
      friendlyName: 'Orthanc DICOMweb',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'orthanc',
        wadoUriRoot: '/dicom-web',
        qidoRoot: '/dicom-web',
        wadoRoot: '/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        dicomUploadEnabled: true,
        singlepart: 'bulkdata,video',
        bulkDataURI: {
          enabled: true,
        },
      },
    },
  ],
  defaultDataSourceName: 'dicomweb',
};
