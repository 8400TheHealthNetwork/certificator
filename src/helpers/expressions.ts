import jsonata from 'jsonata';
import type { Expression } from 'jsonata';

export const getKitTransformer: Expression = jsonata(`
    (
      $actionsMap := actions{
        id: {'description': description, 'mapping': mapping}
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
                'Test Name': name,
                'Description': description,
                'Status': $getTestStatus(id),
                'Details': details,
                'Actions': '\n' & (actions#$i.(
                  $string($i + 1) & '. ' & $lookup($actionsMap, $).description & ' (' & $getActionStatus($lookup($actionsMap, $).mapping).statusText & ')'
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
        'timestamp': $fromMillis($millis(), '[Y0000]-[M00]-[D00]_[H00][m00][s00]'),
        'kitId': $kitId,
        'tests': kits[id = $kitId].children.children.children.{
          'testId': id,
          'skipped': $not(id in $selectedTests)
        }[]
      }
    `
);

export const getSelectedTests: Expression = jsonata(`
    tests[skipped=false].testId[]
  `
);

export const getTestActions: Expression = jsonata(`
    $kits.kits.children.children.children[id=$testId].actions.(
      $actionId := $;
      $kits.actions[id=$actionId].mapping[]
    )
  `
);

export const runTestListExpr: Expression = jsonata('$testList.$runTest($)');

export const runActionListExpr: Expression = jsonata('$actionList.$runAction($)');

export const validateTree: Expression = jsonata(`
    (
      $missingActions := kits.children.children.children.actions@$actId.{
        'actionId': $actId,
        'testId': %.id,
        'actionExists': $exists(%.%.%.%.%.actions[id=$actId])
      }[actionExists=false].{'test': testId, 'action': actionId};

      $count($missingActions) > 0 ? $error('Some tests reference actions that are not defined!\n' & $string($missingActions))
    )
  `
);
