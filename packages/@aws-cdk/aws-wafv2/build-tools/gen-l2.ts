/* eslint-disable import/no-extraneous-dependencies */
import { generate, L2Gen, Enum, STRING, DURATION, objLit, renderDuration, ifDefined, BOOLEAN, TRUE, FALSE, jsVal, EnumClass, ANY, litVal, NUMBER, ifDefinedAny, definedOrElse, IntegrationType, arrayOf, stackToJsonString } from '@aws-cdk/l2gen';

//////////////////////////////////////////////////////////////////////

const scope = new Enum('Scope');
const cloudFrontScope = scope.addMember({ name: 'CLOUDFRONT', cloudFormationString: 'CLOUDFRONT', summary: '' });
const regionalScope = scope.addMember({ name: 'REGIONAL', cloudFormationString: 'REGIONAL', summary: '' });

//////////////////////////////////////////////////////////////////////

const protectedResource = new IntegrationType('ProtectedResource');
protectedResource.bindResult({
  name: 'scope',
  type: scope,
  required: true,
  summary: 'The scope associated with this resource',
});
protectedResource.bindResult({
  name: 'id',
  type: STRING,
  required: true,
  summary: 'Construct identifier for the association',
});
protectedResource.bindResult({
  name: 'resourceArn',
  type: STRING,
  required: false,
  summary: 'ARN of the protected resource',
  details: 'If not supplied, no WebACLAssociation resource will be created. The association must happen on the protected resource itself.',
});
protectedResource.integration('ProtectedCloudFrontDistribution', int => {
  int.wireBindResult({
    id: int.positional('id', STRING),
    scope: cloudFrontScope,
  });
});
protectedResource.integration('ProtectedRestApi', int => {
  int.wireBindResult({
    id: int.positional('id', STRING),
    scope: regionalScope,
  });
});
protectedResource.integration('ProtectedApplicationLoadBalancer', int => {
  int.wireBindResult({
    id: int.positional('id', STRING),
    scope: regionalScope,
  });
});
protectedResource.integration('ProtectedGraphQlApi', int => {
  int.wireBindResult({
    id: int.positional('id', STRING),
    scope: regionalScope,
  });
});

//////////////////////////////////////////////////////////////////////

const defaultActionType = new EnumClass('DefaultAction', {
  typeCheckedReturnType: L2Gen.genTypeForProperty('AWS::WAFv2::WebACL', 'DefaultAction'),
});
defaultActionType.alternative('allow', allow => {
  const customHeaders = allow.option({
    name: 'customHeaders',
    type: ANY, // FIXME:
    required: false,
    summary: 'HTTP headers to insert into the request.',
    defaultDescription: 'No additional headers inserted',
  });
  allow.wire({
    allow: objLit({
      customRequestHandling: ifDefined(customHeaders, objLit({
        insertHeaders: litVal('[]'), // FIXME
      })),
    }),
  });
});
defaultActionType.alternative('block', block => {
  const responseCode = block.option({
    name: 'responseCode',
    type: NUMBER,
    required: false,
    summary: 'The HTTP status code to return to the client.',
    defaultDescription: '403 Forbidden',
  });

  const responseBodyKey = block.option({
    name: 'responseBodyKey',
    type: STRING,
    required: false,
    summary: 'References the response body that you want AWS WAF to return to the web request client.',
    details: 'You can define a custom response for a rule action or a default web ACL action that is set to block. To do this, you first define the response body key and value in the CustomResponseBodies setting for the AWS::WAFv2::WebACL or AWS::WAFv2::RuleGroup where you want to use it.',
    defaultDescription: 'No response body',
  });

  const responseHeaders = block.option({
    name: 'responseHeaders',
    type: ANY, // FIXME
    required: false,
    summary: 'The HTTP headers to use in the response.',
    defaultDescription: 'No additional headers',
  });


  block.wire({
    block: objLit({
      customResponse: ifDefinedAny([responseBodyKey, responseCode, responseHeaders], objLit({
        customResponseBodyKey: responseBodyKey,
        responseCode: definedOrElse(responseCode, jsVal(403)),
        responseHeaders,
      })),
    }),
  });
});

//////////////////////////////////////////////////////////////////////

const customResponseBody = new EnumClass('CustomResponseBody', {
  typeCheckedReturnType: L2Gen.genTypeForPropertyType('AWS::WAFv2::WebACL', 'CustomResponseBody'),
});
customResponseBody.alternative('custom', custom => {
  custom.option({
    name: 'contentType',
    type: STRING,
    required: true,
    summary: 'The type of content in the payload that you are defining in the Content string.',
    wire: 'contentType',
  });
  custom.option({
    name: 'content',
    type: STRING,
    required: true,
    summary: 'The payload of the custom response.',
    wire: 'content',
  });
});
customResponseBody.alternative('text', custom => {
  custom.wire({
    contentType: jsVal('TEXT_PLAIN'),
  });
  custom.positional({
    name: 'content',
    type: STRING,
    required: true,
    summary: 'The text payload of the custom response.',
    wire: 'content',
  });
});
customResponseBody.alternative('html', custom => {
  custom.wire({
    contentType: jsVal('TEXT_HTML'),
  });
  custom.positional({
    name: 'content',
    type: STRING,
    required: true,
    summary: 'The HTML payload of the custom response.',
    wire: 'content',
  });
});
customResponseBody.alternative('jsonString', custom => {
  custom.wire({
    contentType: jsVal('APPLICATION_JSON'),
  });
  custom.positional({
    name: 'str',
    type: STRING,
    required: true,
    summary: 'The JSON string to use as custom response.',
    wire: 'content',
  });
});
customResponseBody.alternative('jsonObject', custom => {
  custom.wire({
    contentType: jsVal('APPLICATION_JSON'),
  });
  custom.positional({
    name: 'obj',
    type: STRING,
    required: true,
    summary: 'The JSON object to use as custom response.',
    wire: 'content',
    wireTransform: stackToJsonString,
  });
});

//////////////////////////////////////////////////////////////////////

const webAcl = L2Gen.define('AWS::WAFv2::WebACL', res => {
  /* const protectedResources = */ res.addProperty({
    name: 'protectedResources',
    type: arrayOf(protectedResource),
    required: false,
    summary: 'Resources protected by this WebACL',
    defaultDescription: 'Protected resources are added later',
  });

  res.addLazyPrivateProperty({
    name: 'scope',
    type: STRING,
    required: true,
    summary: 'Specifies whether this is for an Amazon CloudFront distribution or for a regional application.',
    details: `
      A regional application can be an Application Load Balancer (ALB), an
      Amazon API Gateway REST API, an AWS AppSync GraphQL API, or an Amazon
      Cognito user pool.`,
    wire: 'scope',
  });

  res.addProperty({
    name: 'description',
    type: STRING,
    required: false,
    summary: 'A description of the web ACL that helps with identification.',
    defaultDescription: 'No description',

    wire: 'description',
  });

  res.addProperty({
    name: 'aclName',
    type: STRING,
    required: false,
    summary: 'The name of the web ACL. You cannot change the name of a web ACL after you create it.',
    defaultDescription: 'A name is automatically generated',

    wire: 'name',
  });

  const immunityTime = res.addProperty({
    name: 'captchaImmunityTime',
    type: DURATION,
    required: false,
    summary: 'Determines how long a CAPTCHA timestamp in the token remains valid after the client successfully solves a CAPTCHA puzzle.',
    defaultDescription: '5 minutes',
  });

  res.wire({
    captchaConfig: ifDefined(immunityTime, objLit({
      immunityTimeProperty: objLit({
        immunityTime: renderDuration(immunityTime, 'toSeconds'),
      }),
    })),
  });

  const cloudWatchMetricsEnabled = res.addProperty({
    name: 'cloudWatchMetricsEnabled',
    type: BOOLEAN,
    required: false,
    summary: 'Whether the associated resource sends metrics to Amazon CloudWatch',
    details: 'For the list of available metrics, see [AWS WAF Metrics](https://docs.aws.amazon.com/waf/latest/developerguide/monitoring-cloudwatch.html#waf-metrics).',
    defaultValue: TRUE,
  });

  const sampledRequestsEnabled = res.addProperty({
    name: 'sampledRequestsEnabled',
    type: BOOLEAN,
    required: false,
    summary: 'Whether AWS WAF should store a sampling of the web requests that match the rules.',
    details: 'You can view the sampled requests through the AWS WAF console.',
    defaultValue: FALSE,
  });

  const defaultDimension = res.addProperty({
    name: 'cloudWatchDefaultDimension',
    type: STRING,
    required: false,
    summary: 'The value used for the "Rule" dimension when the default action is taken.',
    defaultValue: jsVal('DefaultAction'),
  });

  res.wire({
    visibilityConfig: objLit({
      cloudWatchMetricsEnabled,
      sampledRequestsEnabled,
      // Rename on purpose, the upstream value is misnamed
      metricName: defaultDimension,
    }),
  });

  const defaultAction = res.addProperty({
    name: 'defaultAction',
    type: defaultActionType,
    required: true,
    summary: 'The action to perform if none of the Rules contained in the WebACL match.',
  });

  res.wire({
    defaultAction: defaultActionType.unfold(defaultAction),
  });

  res.identification({
    arnFormat: 'arn:${Partition}:wafv2:${Region}:${Account}:${Scope}/webacl/${Name}/${Id}',
    arnProperty: {
      name: 'webAclArn',
      sourceProperty: 'attrArn',
      summary: 'The Amazon Resource Name (ARN) of the web ACL.',
    },
    fields: {
      Name: {
        name: 'webAclName',
        sourceProperty: 'ref',
        summary: 'The Name of the web ACL.',
        splitSelect: 0,
      },
      Id: {
        name: 'webAclId',
        sourceProperty: 'ref',
        summary: 'The ID of the web ACL.',
        splitSelect: 1,
      },
      Scope: {
        name: 'webAclScopeName',
        sourceProperty: 'ref',
        summary: 'String representation of the web ACL scope.',
        splitSelect: 2,
      },
    },
  });
});

//////////////////////////////////////////////////////////////////////

generate(
  scope,
  webAcl,
  defaultActionType,
  protectedResource,
  customResponseBody,
);