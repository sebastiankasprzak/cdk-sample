import * as cdk from '@aws-cdk/core';
import {Function, CfnVersion, Alias, Runtime, Code } from '@aws-cdk/aws-lambda';
import {LambdaApplication, LambdaDeploymentGroup, LambdaDeploymentConfig} from '@aws-cdk/aws-codedeploy';
import {MathExpression, ComparisonOperator} from '@aws-cdk/aws-cloudwatch';


export class CdkDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const helloLambda = new Function(this, "MyLambda", {
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: Code.fromInline(`exports.handler = handler.toString();`),
      description: `Generated on: ${new Date().toISOString()}`,
    });

    const version = helloLambda.addVersion(new Date().toISOString());
    const alias = new Alias(this, 'MyLambda-alias', {
      aliasName: 'live',
      version,
    });

    const application = new LambdaApplication(this, 'CodeDeployApplication', {
      applicationName: 'MyApplication', // optional property
    });


    const allProblems = new MathExpression({
      expression: "errors/invocations*100",
      usingMetrics: {
        errors: alias.metricErrors(),
        invocations: alias.metricInvocations(),
      }
    });

    const problemsAlarm = allProblems.createAlarm(this, "Alarm", {
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      alarmName: "MyAlarm1",

    })
      
    const deploymentGroup = new LambdaDeploymentGroup(this, 'BlueGreenDeployment', {
      application: application, // optional property: one will be created for you if not provided
      alias: alias,
      deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
      alarms: [problemsAlarm]
    });
  }
}
