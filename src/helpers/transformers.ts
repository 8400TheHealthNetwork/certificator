import jsonata from 'jsonata';
import type { Expression } from 'jsonata';

export const getKitTransformer: Expression = jsonata(`
    (
      $actionsMap := actions{
        id: description
      };
  
      kits[id=$kitId].{
        'children': children.{
          'id': id,
          'name': name,
          'metadata': description ? {
            'description': description,
            'status': 'ready'
          },
          'children': children.{
            'id': id,
            'name': name,
            'metadata': {
              'status': 'ready'
            },
            'children': children.{
              'id': id,
              'name': name,
              'metadata': {
                'Description': description,
                'Status': 'ready',
                'Details': details,
                'Actions': '\n' & (actions#$i.(
                  $string($i + 1) & '. ' & $lookup($actionsMap, $) & ' (ready)'
                ) ~> $join( '\n'))
              }
            }[]
          }[]
        }[]
      }
    )
  `);

export const getKitsTransformer: Expression = jsonata(`
    {
      'kits': kits.{
        'id': id,
        'name': name,
        'description': description,
        'status': $getKitStatus(id)
      }[]
    }`
);

export const runWorkflowTransformer: Expression = jsonata(`
      {
        'timestamp': $fromMillis($millis(), '[Y0000][M00][D00]_[H00][m00][s00]'),
        'kitId': $kitId,
        'tests': kits[id = $kitId].children.children.children.{
          'testId': id,
          'skipped': $not(id in $selectedTests)
        }[]
      }
    `
);