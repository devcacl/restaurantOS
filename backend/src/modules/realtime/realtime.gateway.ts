import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Supabase Realtime WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Realtime WebSocket: ${client.id}`);
  }

  @SubscribeMessage('join_branch')
  handleJoinBranch(@MessageBody() data: { branchId: string }, @ConnectedSocket() client: Socket) {
    if (data?.branchId) {
      client.join(`branch_${data.branchId}`);
      this.logger.log(`Socket ${client.id} joined channel branch_${data.branchId}`);
      return { status: 'joined', branchId: data.branchId };
    }
  }

  /**
   * Broadcast order status update (e.g. PENDING -> PREPARING -> READY) to branch subscribers
   */
  emitOrderUpdate(branchId: string, orderData: any) {
    if (this.server) {
      this.server.to(`branch_${branchId}`).emit('order_updated', orderData);
      this.logger.log(`Broadcasted order_updated event for branch ${branchId}`);
    }
  }

  /**
   * Broadcast low stock warning notification
   */
  emitLowStockWarning(branchId: string, itemData: any) {
    if (this.server) {
      this.server.to(`branch_${branchId}`).emit('low_stock_alert', itemData);
    }
  }
}
