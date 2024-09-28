import jsonata from 'jsonata';
import type { Expression } from 'jsonata';

export const getKitTransformer: Expression = jsonata(`
    (
      $actionsMap := actions{
        id: {'description': description, 'mapping': mapping}
      };

      $kitStatus := $getKitStatus($kitId);

      $calcStatus := function($children){(
        $count($children[metadata.status = 'in-progress']) > 0 ? 'in-progress' : (
          $count($children[metadata.status = 'skipped']) = $count($children) ? 'skipped' : (
            $count($children[metadata.status in ['skipped','completed','passed','failed','error']]) = $count($children) ? 'completed' : (
              $count($children[metadata.status in ['skipped','ready']]) = $count($children) ? 'ready' : 'unknown'
            )
          )
        )
      )};
  
      $kitTree := kits[id=$kitId].{
        'children': children.{
          'id': id,
          'name': name,
          'metadata': {
            'description': description,
            'status': $kitStatus
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
                'status': $getTestStatus(id),
                'Details': details,
                'Actions': '\n' & (actions#$i.(
                  $string($i + 1) & '. ' & $lookup($actionsMap, $).description & ' (' & $getActionStatus($lookup($actionsMap, $).mapping).statusText & ')'
                ) ~> $join( '\n'))
              }
            }[]
          }[]
        }[]
      };
      $kitTree := $kitTree ~> |children.children|{'metadata': {'status': $calcStatus(children)}}|;
      $kitTree := $kitTree ~> |children|{'metadata': {'status': $calcStatus(children)}}|;
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

export const getSkippedTests: Expression = jsonata(`
  tests[skipped=true].testId[]
`
);

export const getTestActions: Expression = jsonata(`
    $kits.kits.children.children.children[id=$testId].actions.(
      $actionId := $;
      $kits.actions[id=$actionId].mapping
    )[]
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

      $count($missingActions) > 0 ? $error('Some tests reference actions that are not defined!\n' & $string($missingActions, true))
    )
  `
);
