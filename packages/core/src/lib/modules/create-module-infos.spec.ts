import FileInfo, { buildFileInfo } from '../file-info/file-info';
import { createModuleInfos } from './create-module-infos';
import findFileInfo from '../test/find-file-info';
import { ModuleInfo, ROOT_MODULE } from './module-info';
import { expect, it, describe, beforeAll, beforeEach } from 'vitest';
import throwIfNull from '../util/throw-if-null';
import getFs, { useDefaultFs, useVirtualFs } from '../fs/getFs';

type TestParameter = {
  name: string;
  fileInfo: FileInfo;
  modulePaths: string[];
  expectedModuleInfos: { path: string; fileInfoPaths: string[] }[];
};

const simple: () => TestParameter = () => ({
  name: 'simple',
  fileInfo: buildFileInfo('/src/app/app.component.ts', [
    './customers/customer.component.ts',
    ['./holidays/index.ts', ['./holiday.component.ts']],
  ]),
  modulePaths: ['/src/app/customers/index.ts', '/src/app/holidays/index.ts'],
  expectedModuleInfos: [
    {
      path: '/src/app/customers/index.ts',
      fileInfoPaths: ['/src/app/customers/customer.component.ts'],
    },
    {
      path: '/src/app/holidays/index.ts',
      fileInfoPaths: ['/src/app/holidays/holiday.component.ts'],
    },
    {
      path: ROOT_MODULE,
      fileInfoPaths: ['/src/app/app.component.ts'],
    },
  ],
});

const multipleFilesPerModule: () => TestParameter = () => ({
  name: 'multiple files per module',
  fileInfo: buildFileInfo('/src/app/app.component.ts', [
    './customers/customer.component.ts',
    './customers/detail.component.ts',
    './customers/customer.service.ts',
    [
      './holidays/index.ts',
      ['./holiday.component.ts', './detail.component.ts', './holiday.pipe.ts'],
    ],
  ]),
  modulePaths: ['/src/app/customers/index.ts', '/src/app/holidays/index.ts'],
  expectedModuleInfos: [
    {
      path: '/src/app/customers/index.ts',
      fileInfoPaths: [
        '/src/app/customers/customer.component.ts',
        '/src/app/customers/detail.component.ts',
        '/src/app/customers/customer.service.ts',
      ],
    },
    {
      path: '/src/app/holidays/index.ts',
      fileInfoPaths: [
        '/src/app/holidays/holiday.component.ts',
        '/src/app/holidays/detail.component.ts',
        '/src/app/holidays/holiday.pipe.ts',
      ],
    },
    { path: ROOT_MODULE, fileInfoPaths: ['/src/app/app.component.ts'] },
  ],
});

const noModules: () => TestParameter = () => ({
  name: 'no modules',
  fileInfo: buildFileInfo('/src/app/app.component.ts', [
    './customers/customer.component.ts',
    './holidays/holiday.component.ts',
  ]),
  modulePaths: [],
  expectedModuleInfos: [
    {
      path: ROOT_MODULE,
      fileInfoPaths: [
        '/src/app/app.component.ts',
        '/src/app/customers/customer.component.ts',
        '/src/app/holidays/holiday.component.ts',
      ],
    },
  ],
});

const nestedModules: () => TestParameter = () => ({
  name: 'nested modules',
  fileInfo: buildFileInfo('/src/app/main.ts', [
    [
      './app.component.ts',
      [
        [
          './customers/customer.component.ts',
          [
            './feature/feature.service.ts',
            './data/customer.facade.ts',
            './ui/ui.component.ts',
          ],
        ],
      ],
    ],
  ]),
  modulePaths: [
    '/src/app/customers/index.ts',
    '/src/app/customers/feature/index.ts',
    '/src/app/customers/data/index.ts',
    '/src/app/customers/ui/index.ts',
  ],
  expectedModuleInfos: [
    {
      path: '/src/app/customers/index.ts',
      fileInfoPaths: ['/src/app/customers/customer.component.ts'],
    },
    {
      path: '/src/app/customers/feature/index.ts',
      fileInfoPaths: ['/src/app/customers/feature/feature.service.ts'],
    },
    {
      path: '/src/app/customers/data/index.ts',
      fileInfoPaths: ['/src/app/customers/data/customer.facade.ts'],
    },
    {
      path: '/src/app/customers/ui/index.ts',
      fileInfoPaths: ['/src/app/customers/ui/ui.component.ts'],
    },
    {
      path: ROOT_MODULE,
      fileInfoPaths: ['/src/app/main.ts', '/src/app/app.component.ts'],
    },
  ],
});

const multipleDirectories: () => TestParameter = () => ({
  name: 'multipe directories',
  fileInfo: buildFileInfo('/src/app/main.ts', [
    [
      './app.component.ts',
      [
        [
          './customers/customer.component.ts',
          [
            './feature/feature.service.ts',
            './data/customer.facade.ts',
            './ui/ui.component.ts',
          ],
        ],
      ],
    ],
  ]),
  modulePaths: ['/src/app/customers/index.ts'],
  expectedModuleInfos: [
    {
      path: '/src/app/customers/index.ts',
      fileInfoPaths: [
        '/src/app/customers/customer.component.ts',
        '/src/app/customers/feature/feature.service.ts',
        '/src/app/customers/data/customer.facade.ts',
        '/src/app/customers/ui/ui.component.ts',
      ],
    },
    {
      path: ROOT_MODULE,
      fileInfoPaths: ['/src/app/main.ts', '/src/app/app.component.ts'],
    },
  ],
});

describe('create module infos', () => {
  beforeAll(() => {
    useVirtualFs();
  });

  beforeEach(() => {
    getFs().reset();
  });

  it.each([
    ['simple', simple],
    ['multipleFilesPerModule', multipleFilesPerModule],
    ['noModules', noModules],
    ['nestedModules', nestedModules],
    ['multipleDirectories', multipleDirectories],
  ])(
    'should create a moduleInfos for configuration: %s',
    (_, createTestParams) => {
      const { fileInfo, modulePaths, expectedModuleInfos } = createTestParams();
      const moduleInfos = createModuleInfos(fileInfo, modulePaths);

      expect(moduleInfos).toEqual(
        expectedModuleInfos.map((mi) => {
          const fileInfos = mi.fileInfoPaths.map((fip) =>
            throwIfNull(
              findFileInfo(fileInfo, fip),
              `${fip} does not exist in passed FileInfo`
            )
          );
          const moduleInfo = new ModuleInfo(mi.path);
          for (const fi of fileInfos) {
            moduleInfo.assignFileInfo(fi);
          }

          return moduleInfo;
        })
      );
    }
  );
});
