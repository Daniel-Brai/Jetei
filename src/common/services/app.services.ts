import { Injectable } from '@nestjs/common';
import { Operation, OperationType } from '@/interfaces';

/**
 * @class OperationalTransformationService
 * @classdesc The base class of OT operations on a document
 * @author Daniel Brai
 * @description This service implements a character wise inclusion transformation operation
 *
 * @see References:
 * https://en.wikipedia.org/wiki/Operational_transformation
 * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.53.933&rep=rep1&type=pdf
 * https://srijancse.medium.com/operational-transformation-the-real-time-collaborative-editing-algorithm-bf8756683f66
 *
 * Limitations: This implementation does not take into account operation history for undo capability and is limited to two for now
 *
 * Improvement: This implementation will support multiple users in the future alongside undo capabliblity
 *
 */
@Injectable()
export class OperationalTransformationService {
  /**
   * Resolves dcoument operation
   * @param operation The initial operation carried out by the initial user
   * @param remoteOperation The remote operation carried by another user
   * @returns {Operation} The new operation
   */
  public transformOperation(
    operation: Operation,
    remoteOperation: Operation,
  ): Operation {
    switch (operation.type) {
      case OperationType.INSERT:
        if (remoteOperation.type === OperationType.INSERT)
          return this.tii(operation, remoteOperation);
        if (remoteOperation.type === OperationType.DELETE)
          return this.tid(operation, remoteOperation);
      case OperationType.DELETE:
        if (remoteOperation.type === OperationType.DELETE)
          return this.tdd(operation, remoteOperation);
        if (remoteOperation.type === OperationType.INSERT)
          return this.tdi(operation, remoteOperation);
    }
  }

  /**
   * Transform on Operation Insert  and Insert
   * @param {Operation} op1 The initial operation carried out by the initial user
   * @param {Operation} op2 The remote opearion by another user
   * @returns {Operation} The returned operation
   */
  private tii(op1: Operation, op2: Operation): Operation {
    if (
      op1.type === OperationType.INSERT &&
      op2.type === OperationType.INSERT
    ) {
      if (
        op1.position < op2.position ||
        (op1.position === op2.position &&
          op1.userId === op1.preferredUserId &&
          (op2.userId !== op1.preferredUserId ||
            op2.userId !== op2.preferredUserId))
      ) {
        return op1;
      }
      return { position: op1.position + 1, ...op1 };
    }
  }

  /**
   * Transform on Operation Insert and Delete
   * @param {Operation} op1 The initial operation carried out by the initial user
   * @param {Operation} op2 The remote opearion by another user
   * @returns {Operation} The returned operation
   */
  private tid(op1: Operation, op2: Operation): Operation {
    if (
      op1.type === OperationType.INSERT &&
      op2.type === OperationType.DELETE
    ) {
      if (op1.position <= op2.position) {
        return op1;
      }
      return { position: op1.position - 1, ...op1 };
    }
  }

  /**
   * Transform on Operation Delete and Insert
   * @param {Operation} op1 The initial opeartion carried out by the initial user
   * @param {Operation} op2 The remote opearion by another user
   * @returns {Operation} The returned operation
   */
  private tdi(op1: Operation, op2: Operation): Operation {
    if (
      op1.type === OperationType.DELETE &&
      op2.type === OperationType.INSERT
    ) {
      if (op1.position < op2.position) {
        return op1;
      }
      return { position: op1.position + 1, ...op1 };
    }
  }

  /**
   * Transform on Operation Delete and Delete
   * @param {Operation} op1 The initial operation carried out by the initial user
   * @param {Operation} op2 The remote opearion by another user
   * @returns {Operation} The returned operation
   */
  private tdd(op1: Operation, op2: Operation): Operation {
    if (
      op1.type === OperationType.DELETE &&
      op2.type === OperationType.DELETE
    ) {
      if (op1.position < op2.position) {
        return op1;
      } else if (op1.position > op2.position) {
        return { position: op1.position - 1, ...op1 };
      } else if (op1.position === op2.position) {
        return op1;
      }
    }
  }
}
