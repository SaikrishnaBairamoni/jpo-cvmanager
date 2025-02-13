import React from 'react'
import { render, screen, fireEvent, queryByAttribute } from '@testing-library/react'
import Map from './Map'
import { Provider } from 'react-redux'
import { setupStore } from '../store'
import { replaceChaoticIds } from '../utils/test-utils'

it('snapshot bsmCoordinates wzdx', () => {
  const initialState = {
    rsu: {
      value: {
        bsmCoordinates: [],
        rsuCounts: {},
        mapList: [],
        bsmData: [],
        bsmStart: '2023-05-10T03:24:00',
        bsmEnd: '2023-05-10T03:25:00',
        bsmCoordinates: [
          [-104.9903, 39.7392],
          [-104.9904, 39.7393],
          [-104.9905, 39.7391],
        ],
      },
    },
    wzdx: {
      value: {
        features: [
          {
            properties: {
              core_details: {
                road_names: ['road_name_1'],
                direction: 'direction',
                description: 'description',
              },
              vehicle_impact: 'vehicle_impact',
              workers_present: 'workers_present',
              start_date: 'start_date',
              end_date: 'end_date',
            },
            geometry: {
              coordinates: [
                [-104.9903, 39.7392],
                [-104.9908, 39.7398],
                [-104.9909, 39.7399],
              ],
            },
          },
        ],
      },
    },
  }
  const { container } = render(
    <Provider store={setupStore(initialState)}>
      <Map />
    </Provider>
  )

  fireEvent.click(screen.queryByText('RSU'))
  fireEvent.click(screen.queryByText('Heatmap'))
  fireEvent.click(screen.queryByText('BSM Viewer'))
  fireEvent.click(screen.queryByText('WZDx'))

  expect(replaceChaoticIds(container)).toMatchSnapshot()
})

it('snapshot bsmData clicked', () => {
  const initialState = {
    rsu: {
      value: {
        bsmCoordinates: [],
        rsuCounts: {},
        mapList: [],
        bsmStart: '2023-05-10T03:24:00',
        bsmFilterStep: 60, // 1 hour
        bsmFilterOffset: 24 * 4, // 4 days
        bsmData: [
          {
            properties: {
              time: new Date('2023-05-12T03:24:00'),
            },
          },
          {
            properties: {
              time: new Date('2023-05-17T03:24:00'),
            },
          },
        ],
      },
    },
    config: {
      value: {
        configCoordinates: [],
        configList: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        addConfigPoint: false,
      },
    },
  }
  const { container } = render(
    <Provider store={setupStore(initialState)}>
      <Map />
    </Provider>
  )

  expect(replaceChaoticIds(container)).toMatchSnapshot()
})
