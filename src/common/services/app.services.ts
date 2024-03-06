import { Injectable } from '@nestjs/common';
import { Operation, OperationType } from '@/interfaces';
import { Document } from '@/types';

/**
 * @class OperationalTransformationService
 * @classdesc The base class of OT operations on a document
 * @constructor The initial content of the document to be operated on
 * @author Daniel Brai
 * @description This service implements a character wise inclusion/exclusion transformation service
 *
 * References:
 * https://en.wikipedia.org/wiki/Operational_transformation
 * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.53.933&rep=rep1&type=pdf
 * https://srijancse.medium.com/operational-transformation-the-real-time-collaborative-editing-algorithm-bf8756683f66
 *
 */
@Injectable()
export class OperationalTransformationService {
  private document: Document;

  constructor(initialContent: string) {
    this.document = new Document(initialContent);
  }

  transformOperation(operation: Operation, history: Operation[]): Operation {
    // Implement transformation logic here
    return transformedOperation;
  }

  tii(op1: Operation, op2: Operation): Operation {
    if (
      op1.type === OperationType.INSERT &&
      op2.type === OperationType.INSERT
    ) {
    } else {
      throw new Error(
        `Unsupported operation type with operation 1: ${op1.type} and operation 2: ${op2.type}`,
      );
    }
  }
  tid(op1: Operation, op2: Operation): Operation {
    if (
      op1.type === OperationType.INSERT &&
      op2.type === OperationType.DELETE
    ) {
    } else {
      throw new Error(
        `Unsupported operation type with operation 1: ${op1.type} and operation 2: ${op2.type}`,
      );
    }
  }
  tdi(op1: Operation, op2: Operation): Operation {
    if (
      op1.type === OperationType.DELETE &&
      op2.type === OperationType.INSERT
    ) {
    } else {
      throw new Error(
        `Unsupported operation type with operation 1: ${op1.type} and operation 2: ${op2.type}`,
      );
    }
  }
  tdd(op1: Operation, op2: Operation): Operation {
    if (
      op1.type === OperationType.DELETE &&
      op2.type === OperationType.DELETE
    ) {
    } else {
      throw new Error(
        `Unsupported operation type with operation 1: ${op1.type} and operation 2: ${op2.type}`,
      );
    }
  }
}
